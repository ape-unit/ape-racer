window.onload = init;

function init() {
    const text_input = document.getElementById('text_input');
    const excerpt = document.getElementById('excerpt');
    const countdown_number = document.getElementById('countdown_number');
    const name = document.getElementById('name').getAttribute('data-name');
    const wpm_number = document.getElementById('wpm_number');

    let playerCount = 0;

    let excerptArray;
    
    text_input.disabled = true;
    let client = new Colyseus.Client("ws://localhost:3000");
    let room = client.join('typeroom');
    room.onJoin.add(() => {
        room.send({ name });
    });
    room.listen('excerptArray', change => {
        let spanArray = change.value.map((value, index) => {
            return "<span id=" + index + ">" + value + "</span>";
        });
        excerptArray = change.value;
        excerpt.innerHTML = spanArray.join(" ");
        document.getElementById(0).className = 'highlight';
    })
    room.listen('timeToStart', change => {
        countdown_number.innerHTML = change.value;
        let wordCount = 0;
        if (change.value === 0) {
            text_input.disabled = false;
            text_input.addEventListener('keypress', e => {
                let wordInputted = text_input.value.replace(/\s/g, '');
                let word = document.getElementById(wordCount);
                if (e.charCode === 32 && wordInputted == excerptArray[wordCount]) { //space is clicked
                    room.send({ wordInput: text_input.value });
                    text_input.value = '';
                    if (wordInputted === word.innerHTML) {
                        word.className = 'correct';
                    } else {
                        word.className = 'incorrect';
                    }
                    wordCount++;
                    word = document.getElementById(wordCount);
                    word.className = 'highlight';
                }
            });
            text_input.focus();
            text_input.addEventListener('keyup', e => {
                if (e.charCode !== 32) {
                    let wordInputted = text_input.value.replace(/\s/g, '');
                    let word = document.getElementById(wordCount);
                    let length = wordInputted.length;
                    let wordSubstring = word.innerHTML.substring(0, length);
                    if (wordInputted !== wordSubstring) {
                        word.className = 'highlight-wrong';
                    } else {
                        word.className = 'highlight';
                    }
                }
            });
        }
    });
    room.listen('players/:id/wpm', change => {
        if (change.path['id'] === room.sessionId) {
            wpm_number.innerHTML = Math.round(change.value);
        }
    });
    room.listen('players/:id', change => {
        if (change.operation === "add") {
            let progressBar = document.getElementById('player' + playerCount);
            progressBar.id = change.path.id;
            progressBar.style.display = "block";
            let progressMarker = document.getElementById('player' + playerCount);
            progressMarker.id = change.path.id + 'marker';
            playerCount++;
        }
    });
    room.listen('players/:id/percentageTraversed', change => {
        let progressMarker = document.getElementById(change.path['id'] + 'marker');
        //values gotten from progress bar values
        let percentage = 72 - (change.value * 100) * .8
        progressMarker.style.top = percentage + '%';
    });
}
