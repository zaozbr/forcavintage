let level = 'facil',
    alreadyUsed = [],
    word, lives, points = 0,
    hit = 0;
const urlApi = "https://api.dicionario-aberto.net/",
    controls = document.getElementById("controls"),
    inGame = document.getElementById("inGame"),
    preGame = document.getElementById("preGame"),
    board = document.getElementById("board"),
    score = document.getElementById("score"),
    actualScore = document.getElementById("actualScore"),
    hint = document.getElementById("hint"),
    blink = document.getElementById("blink"),
    gameInput = document.getElementById("gameInput"),
    usedList = document.getElementById("usedList"),
    gameOverScreen = document.getElementById("gameOver"),
    win = document.getElementById("win"),
    loose = document.getElementById("loose"),
    pointsWin = document.getElementById("pointsWin"),
    getRandom = (base) => {
        console.log('getrandom base', base)
        let randomIndex = Math.floor(Math.random() * base.length);
        console.log('base randomizado', randomIndex, base[randomIndex])
        return base[randomIndex];
    },
    fetcher = async(url, type) => {
        const response = await fetch(url);
        if (type === 'json') return (response.json());
        if (type === 'txt') return (await response.text()).split(",");
    },
    getRandomWord = async() => {
        let wordRandom;
        switch (level) {
            case 'dificil':
                console.log('inicializando no nivel dificil')
                return { word: getRandom(await fetcher('dificil.txt', 'txt')) }

            case 'insano':
                console.log('inicializando no nivel insano')
                wordRandom = await fetcher(`${urlApi}random `, 'json')
                return wordRandom

            default:
                console.log('inicializando no nivel default / facil')
                return { word: getRandom(await fetcher('facil.txt', 'txt')) }
        }
    },
    setWord = async() => {
        let proxyWordRandom = await getRandomWord();
        let wordRandom = proxyWordRandom.word
        console.log('setWord', wordRandom)
        let wordData = await fetcher(`${urlApi}word/${wordRandom}/1`, 'json');
        console.log('set word return', wordData)
        return wordData;
    },
    cleanInvalidChar = async(wordToClean) => {
        console.log(' cleanInvalidChar', wordToClean)
        let toClean = wordToClean
        return toClean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },
    applyHintText = (dadosWord) => { hint.innerHTML = (dadosWord[0].xml).replaceAll(dadosWord[0].word, ' ... '); return 'ok' },
    validateInput = () => {
        console.log(`conteudo = ${gameInput.value}  tamanho = ${gameInput.value.length} só letras = ${!/[^a-zA-Z]/.test(gameInput.value)}`)
        if (gameInput.value.length > 1) {
            gameInput.value = gameInput.value.substr(0, 1);
        }
        gameInput.value = !/[^a-zA-Z]/.test(gameInput.value) && alreadyUsed.indexOf(gameInput.value) == -1 ? gameInput.value.toLowerCase() : ''
    },
    applyNewLetter = (letter) => {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
                hit++
                let casa = document.getElementById(`casa${i}`)
                casa.innerHTML = letter
                casa.classList.add("fullfilled")
                points += 10
            }
        }
    },
    decreaseLife = () => {
        lives--;
        points -= 10
        let bodyPart = `dead${lives}`
        document.getElementById(bodyPart).style.opacity = 1
        if (lives <= 0) {
            setTimeout(function() {
                gameOver()
            }, 1000);
        }
    },
    gameOver = () => {
        gameOverScreen.style.display = "inline-flex"
        win.style.display = 'none'
        loose.style.display = "inline-flex"
    },
    reset = () => {
        hit = 0
        word = null
        alreadyUsed = []
        lives = 5
        gameInput.value = ''
        preGame.style.display = "none"
        inGame.style.display = "inline-flex"
        gameOverScreen.style.display = "none"
        win.style.display = 'none'
        loose.style.display = 'none'
        points = 0
        actualScore.textContent = points
        usedList.textContent = ''
        for (let i = 0; i < 5; i++) {
            let idNow = 'dead' + i
            document.getElementById(idNow).style.opacity = 0
        }
        hint.style.display = 'inline-block'
    },
    testLetter = async() => {
        if (!gameInput.value) {
            alert('Insira um caratere válido antes de testar!')
            return
        }
        if (word.indexOf(gameInput.value) > -1) {
            await applyNewLetter(gameInput.value)
            console.log(word.length, hit)
            if (word.length == hit) {
                console.log('winnnnnnnn!!!!')
                loose.style.display = 'none'
                gameOverScreen.style.display = 'inline-flex'
                win.style.display = 'inline-flex'
                pointsWin.textContent = `Sua pontuação ${points}`
            }

        } else {
            await decreaseLife()
        }
        alreadyUsed.push(gameInput.value)
        usedList.textContent = alreadyUsed
        console.log('incremento alreadyUsed = ', alreadyUsed)
        gameInput.value = ''
        actualScore.textContent = `${points}`
    },
    startGame = async() => {
        reset()
        const dadosWord = await setWord()
        console.log('dadosWord', dadosWord)
        let applyHintTextStatus = await applyHintText(dadosWord);
        console.log(applyHintTextStatus)

        word = await cleanInvalidChar(dadosWord[0].word)
        await setBoard(word)
        console.log(word)
    },
    setBoard = async(localWord) => {
        let actualHint = await getRandom(localWord);
        let htmlResposta = "";
        for (let i = 0; i < localWord.length; i++) {
            if (!actualHint) { i--; continue }
            console.log("localWord[i] = " + localWord[i]);
            if (localWord[i] === "-") {
                htmlResposta += '<span id="casa-hifen">-</span>';
                continue;
            }
            if (localWord[i] === actualHint) {
                hit++
                htmlResposta += '<span id="casa' + i + '" class="hint">' + actualHint + "</span>";
                continue;
            }
            htmlResposta += '<span id="casa' + i + '"></span>';
        }
        alreadyUsed.push(actualHint)
        console.log("htmlResposta", htmlResposta);
        board.innerHTML = htmlResposta;
    },
    listenChangeLevel = () => {
        const rad = document.level.levelRadios;
        for (let radio of rad) {
            radio.addEventListener('change', function() {
                console.log(level, " => ", this.value)
                if (this.value !== level) {
                    level = this.value;
                }
            })
        }
    },
    init = () => {
        document.addEventListener('keydown', () => {
            gameInput.focus();
        });
        listenChangeLevel()
    };

init();