var app = require('express')();
var http = require('http').createServer(app);
// var gg = app.listen(3000)
const PORT = 3001;
const cors = require('cors');
app.use(cors());
var io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});


var CHANNEL = {
    name: 'Canvas',
    participants: 0,
    participantsArr: [],
    sockets: [],
    messages: [],
    drawings: [],
    color: 'black'
}

app.get("/getChannel", function(req, res) {
    res.json({
        channel: CHANNEL
    })
});


http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});

io.on('connection', (socket) => {


    socket.emit('connection', CHANNEL);


    socket.on('connect-channel', () => {
        console.log('connect-channel');
        io.emit('connect-channel', CHANNEL);
    })
    socket.on('add-participant', (newParticipant) => {
        console.log('add-participant');
        let displayDrawingsPeers = [];
        CHANNEL.participantsArr.forEach((p) => {
            displayDrawingsPeers.push(true)
        })
        let newPrtc = {
            id: newParticipant.id,
            name: newParticipant.name,
            displayDrawingsParticipants: displayDrawingsPeers,
            isConnect: true,
            socketId: socket.id
        }
        CHANNEL.participants++;
        // CHANNEL.sockets.push(socket.id);
        CHANNEL.participantsArr.push(newPrtc)
        CHANNEL.participantsArr.forEach((p, i) => {
            p.displayDrawingsParticipants.push(true)

        })
        io.emit('add-participant-channel', CHANNEL, newParticipant);

    })
    socket.on('send-drawing', drawing => {

        if (CHANNEL.drawings[CHANNEL.drawings.length - 1] && CHANNEL.drawings[CHANNEL.drawings.length - 1].points == []) {
            CHANNEL.drawings[CHANNEL.drawings.length - 1].points.push(drawing.startPoint)
        }
        CHANNEL.drawings[CHANNEL.drawings.length - 1].points.push(drawing.endPoint)
        io.emit('drawing', CHANNEL);
    })
    socket.on('delete-drawings', () => {
        CHANNEL.drawings = []
        io.emit('clear-canvas', CHANNEL);

    })
    socket.on('send-start-drawing', (drawing) => {
        let startDrawing = {
            participantId: drawing.participantId,
            color: drawing.color,
            points: [{ x: drawing.startPoint.x, y: drawing.startPoint.y }]
        }
        CHANNEL.drawings.push(startDrawing);
        io.emit('start-drawing', CHANNEL);
    })

    socket.on('choose-color', (clr) => {
        CHANNEL.color = clr
        io.emit('selected-color', CHANNEL);
    })
    socket.on('reomve-drawings-by-id', (currenrPrtcId, id, isDisplayDrawings) => {
        if (CHANNEL.participantsArr[currenrPrtcId] && CHANNEL.participantsArr[currenrPrtcId].displayDrawingsParticipants) {
            CHANNEL.participantsArr[currenrPrtcId].displayDrawingsParticipants[id] = isDisplayDrawings
        }
        io.emit('reomve-drawings-by-id', CHANNEL, currenrPrtcId);

    })

});