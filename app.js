const tg = window.Telegram.WebApp;
tg.expand();

// 用户ID（Telegram用户ID，如果获取不到用随机数）
let userID = tg.initDataUnsafe.user?.id || Math.floor(Math.random() * 1000000);

// 玩家名字
let username = "Player";

// 当前房间ID
let roomID = null;

// 创建房间
function createRoom() {
    username = document.getElementById("nameInput").value.trim() || "Host";

    roomID = "room" + Math.floor(Math.random() * 9999);

    db.ref("rooms/" + roomID).set({
        host: userID,
        started: false,
        currentTurn: 0,
        reveal: false,
        deck: createDeck(),
        players: {
            [userID]: {
                name: username,
                hand: [],
                stand: false
            }
        }
    });

    listenRoom();
}

// 加入房间
function joinRoom() {
    username = document.getElementById("nameInput").value.trim() || "Player";

    roomID = document.getElementById("roomInput").value.trim();
    if (!roomID) {
        alert("请输入房间ID");
        return;
    }

    db.ref("rooms/" + roomID + "/players/" + userID).set({
        name: username,
        hand: [],
        stand: false
    });

    listenRoom();
}

// 监听房间数据
function listenRoom() {
    db.ref("rooms/" + roomID).on("value", snap => {
        let data = snap.val();
        if (!data) return;

        document.getElementById("roomInfo").innerHTML = "Room: " + roomID;

        renderPlayers(data);

        // 房主显示 Start Game 按钮
        if (data.host == userID && data.started === false) {
            document.getElementById("controls").innerHTML =
                `<button onclick="startGame()">Start Game</button>`;
        }

        // 游戏开始后渲染
        if (data.started) {
            renderGame(data);
            renderControls(data);
        }
    });
}

// 开始游戏（房主点击）
function startGame() {
    let ref = db.ref("rooms/" + roomID);

    ref.once("value").then(snap => {
        let data = snap.val();
        let deck = data.deck;
        let players = data.players;

        // 每人发两张牌
        Object.keys(players).forEach(id => {
            players[id].hand = [deck.pop(), deck.pop()];
            players[id].stand = false; // 重置状态
        });

        ref.update({
            players: players,
            deck: deck,
            started: true,
            currentTurn: 0,
            reveal: false
        });
    });
}

// 玩家抽牌
function hit() {
    let ref = db.ref("rooms/" + roomID);

    ref.once("value").then(snap => {
        let data = snap.val();
        let deck = data.deck;
        let players = data.players;

        players[userID].hand.push(deck.pop());

        ref.update({
            players: players,
            deck: deck
        });
    });
}

// 玩家选择停止补牌
function stand() {
    let ref = db.ref("rooms/" + roomID);

    ref.once("value").then(snap => {
        let data = snap.val();
        let ids = Object.keys(data.players);

        let nextTurn = data.currentTurn + 1;

        // 如果轮到最后一人则不超过总玩家数
        if (nextTurn >= ids.length) nextTurn = ids.length - 1;

        // 标记玩家停止
        data.players[userID].stand = true;

        ref.update({
            players: data.players,
            currentTurn: nextTurn
        });
    });
}

// 房主公开所有牌
function reveal() {
    db.ref("rooms/" + roomID).update({
        reveal: true
    });
}

// 渲染玩家操作按钮
function renderControls(data) {
    let ids = Object.keys(data.players);
    let currentPlayer = ids[data.currentTurn];

    if (currentPlayer != userID) {
        document.getElementById("controls").innerHTML = "等待其他玩家...";
        return;
    }

    let player = data.players[userID];
    let handScore = score(player.hand);

    // 判断是否自动锁牌（Blackjack或对子8+）
    let disableHit = blackjack(player.hand) || strongPair(player.hand) || handScore >= 21;

    let hitBtn = disableHit ? "" : `<button onclick="hit()">Hit</button>`;
    let standBtn = `<button onclick="stand()">Stand / Pass</button>`;

    document.getElementById("controls").innerHTML = hitBtn + standBtn;

    // 如果是房主，游戏结束显示 Reveal
    if (data.host == userID && data.currentTurn == ids.length - 1 && allStand(data)) {
        document.getElementById("controls").innerHTML += `<br><button onclick="reveal()">Reveal All</button>`;
    }
}

// 判断所有玩家是否都停止补牌
function allStand(data) {
    return Object.values(data.players).every(p => p.stand);
}