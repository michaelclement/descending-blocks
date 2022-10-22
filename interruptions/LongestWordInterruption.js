class LongestWordInterruption {
    constructor(improveUX = false) {
        this.html = null;
        this.allButtons;
        this.improveUX = improveUX; // Used to determine if we include HCI improvements
        this.words = [
            "bean", "root", "plum", "apple", "chile", "onion",
            "celery", "tomato", "radish", "cabbage", "pimento", "pumpkin"]
        this.minMaxWords; // Will be obj with longest/shortest lengths
        this.targetOptions = ["longest", "shortest"];
        this.targetLength; // will either be "longest" or "shortest"
        this.isAscending = false;

        this.init();
    }

    init() {
        this.html = this.renderTemplate();
    }

    renderTemplate() {
        let template = document.createElement('template');
        this.targetLength = this.targetOptions[Math.floor(Math.random() * 2)];

        let content = `
            <div id="interruption-inner-container"
                class="flex m-0 mx-auto justify-center align-center items-center h-full flex-col w-[400px]">
                <h1 class="text-center"><b>Select the ${this.targetLength} word</b></h1>
                ${this.buildInputs()}
            </div>
        `.trim()

        template.innerHTML = content;

        // Setup a listener to check if they picked the right word
        let buttons = template.content.querySelectorAll("button");
        buttons.forEach(button => button.onclick = (e) => this.checkVal(e));
        this.allButtons = buttons;

        return template;
    }

    getMinMaxLengths(listOfWords) {
        let minWord = Infinity;
        let maxWord = 0;
        listOfWords.forEach(word => {
            maxWord = word.length > maxWord ? word.length : maxWord;
            minWord = word.length < minWord ? word.length : minWord;
        });
        return { "shortest": minWord, "longest": maxWord };
    }

    checkVal(e) {
        if (e.target.id == 'sort-words-btn') {
            // Flip ascending/descending sort order each time we click to sort
            // this.isAscending = !this.isAscending;

            let parentElement = document.querySelector('#word-btn-container');
            const collator = new Intl.Collator(undefined, { numeric: false, sensitivity: 'base' });

            // sort the buttons on screen by interior word length
            let wb = [...document.querySelectorAll('.word-btn')];
            wb.sort((elementA, elementB) => {
                const [firstElement, secondElement] = this.isAscending ?
                    [elementA, elementB] : [elementB, elementA];
                return collator.compare(firstElement.innerText.length, secondElement.innerText.length)
            }).forEach(element => parentElement.appendChild(element));

            return;
        }

        if (e.target.innerText.length == this.minMaxWords[this.targetLength]) {
            hideInterruption();
        } else {
            e.target.classList.add('bg-red-600');
        }
    }

    buildInputs() {
        let retVal = `
            ${this.improveUX ? `\
            <button class='hover:shadow-lg copy-btn rounded-md bg-blue-600
                text-white mx-[5px] px-[8px] pb-[2px] mt-[5px] flex content-center align-center'\
                title='Toggle sort' id='sort-words-btn'>Sort by length</button>` : ""}
            <div class="flex flex-col flex-wrap mb-2 mt-2 w-[280px] h-[130px] align-center" id="word-btn-container">`;

        let choices = Array.from(Array(6)).map(x => Math.floor(Math.random() * this.words.length));
        let wordChoices = [];
        choices.forEach(c => wordChoices.push(this.words[c]));

        this.minMaxWords = this.getMinMaxLengths(wordChoices);

        choices.forEach((choice, i) => {
            retVal += `
            <button class="px-[7px] flex flex-row justify-center w-[120px] bg-zinc-500
              text-white rounded-md m-[5px] p-[3px] word-btn">${this.words[choice]}
            </button>`
        });
        retVal += `</div>`
        return retVal;
    }
}
