const tg = window.Telegram.WebApp
tg.expand()

const userID = tg.initDataUnsafe.user?.id || Math.random()
const username = tg.initDataUnsafe.user?.first_name || "Player"

let roomID=null

const suits=["♠","♥","♦","♣"]
const ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"]

function createDeck(){

let deck=[]

for(let s of suits){
for(let r of ranks){

deck.push({
rank:r,
suit:s
})

}
}

return deck.sort(()=>Math.random()-0.5)

}

function createRoom(){

roomID="room"+Math.floor(Math.random()*9999)

db.ref("rooms/"+roomID).set({

host:userID,
currentPlayer:0,
started:false,
deck:createDeck(),
players:{
[userID]:{
name:username,
hand:[],
stand:false
}
}

})

listenRoom()

}

function joinRoom(){

roomID=document.getElementById("roomInput").value

db.ref("rooms/"+roomID+"/players/"+userID).set({

name:username,
hand:[],
stand:false

})

listenRoom()

}

function listenRoom(){

db.ref("rooms/"+roomID).on("value",(snap)=>{

let data=snap.val()

renderPlayers(data)

if(data.started){
renderGame(data)
}

})

}

function renderPlayers(data){

let html="Room: "+roomID+"<br><br>Players:<br>"

Object.values(data.players).forEach(p=>{

html+=p.name+"<br>"

})

document.getElementById("players").innerHTML=html

if(data.host==userID && !data.started){

document.getElementById("controls").innerHTML=

`<button onclick="startGame()">Start Game</button>`

}

}

function startGame(){

let ref=db.ref("rooms/"+roomID)

ref.once("value").then(snap=>{

let data=snap.val()

let deck=data.deck

let players=data.players

Object.keys(players).forEach(id=>{

players[id].hand=[deck.pop(),deck.pop()]

})

ref.update({

players:players,
deck:deck,
started:true

})

})

}

function renderGame(data){

let html=""

Object.entries(data.players).forEach(([id,p])=>{

html+="<h3>"+p.name+"</h3>"

p.hand.forEach(c=>{

if(id==userID || allStand(data)){

html+=`<div class="card">${c.rank}${c.suit}</div>`

}else{

html+=`<div class="card back">🂠</div>`

}

})

if(id==userID){

html+="Score:"+score(p.hand)

}

})

document.getElementById("game").innerHTML=html

renderControls(data)

}

function renderControls(data){

let ids=Object.keys(data.players)

let turn=ids[data.currentPlayer]

if(turn!=userID){

document.getElementById("controls").innerHTML="Waiting..."

return

}

document.getElementById("controls").innerHTML=`

<button onclick="hit()">Hit</button>

<button onclick="stand()">Stand</button>

`

}

function hit(){

let ref=db.ref("rooms/"+roomID)

ref.once("value").then(snap=>{

let data=snap.val()

let deck=data.deck

let players=data.players

players[userID].hand.push(deck.pop())

ref.update({

players:players,
deck:deck

})

})

}

function stand(){

let ref=db.ref("rooms/"+roomID)

ref.once("value").then(snap=>{

let data=snap.val()

let ids=Object.keys(data.players)

let index=data.currentPlayer+1

ref.update({

currentPlayer:index

})

})

}

function score(hand){

let total=0
let aces=0

hand.forEach(c=>{

if(c.rank=="A") aces++

else if(["J","Q","K"].includes(c.rank)) total+=10

else total+=parseInt(c.rank)

})

for(let i=0;i<aces;i++){

if(total+11<=21) total+=11
else total+=1

}

return total

}

function allStand(data){

return Object.values(data.players).every(p=>p.stand)

}