class SpatialInterruption {
    constructor(improveUX = false) {
        this.html = null;
        this.allButtons;
        this.clicked = []; // holds ids of buttons that have been clicked
        // Random number from 1-10, signifying the step between
        // buttons the user must click
        this.step = Math.floor(Math.random() * 4) + 1;
        this.improveUX = improveUX; // Used to determine if we include HCI improvements
        this.name = 'spatial';
        this.init();
    }

    init() {
        this.html = this.renderTemplate();
    }

    renderTemplate() {
        let template = document.createElement('template');

        let content = `
            <div id="interruption-inner-container"
                class="flex m-0 mx-auto justify-center align-center items-center h-full flex-col w-[400px]">
                <h1 class="text-center"><b>Click every ${this.formatNumber(this.step)} button</b></h1>
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

    formatNumber(numStr) {
        let retVal = '';
        switch (numStr * 1) {
            case 1:
                retVal = ''
                break;
            case 2:
                retVal = '2nd'
                break;
            case 3:
                retVal = '3rd'
                break;
            default:
                retVal = numStr + 'th'
                break;
        }
        return retVal;
    }

    checkVal(e) {
        // Check if the clicked button is at the right position
        // and hasn't already been selected:
        if ((e.target.title * 1) % this.step == 0 &&
            !this.clicked.includes(e.target.title)) {
            this.clicked.push(e.target.title);
            // Color it to let them know it was clicked
            document.getElementById(`btn-${e.target.title}`).classList.add('bg-green-700');
            // Check if they clicked all the required buttons
            if (this.clicked.length == Math.floor(this.allButtons.length / this.step)) {
                hideInterruption();
            }
        } else if ((e.target.title * 1) % this.step !== 0) {
            // Make it red indicating it was the wrong button
            document.getElementById(`btn-${e.target.title}`).classList.add('bg-red-600');
        }
    }

    buildInputs() {
        let retVal = `\
            <div class="flex flex-row flex-wrap mb-2 mt-2 w-[405px] \
            align-center" id="word-btn-container">`;

        for (let i = 1; i < 10; i++) {
            retVal += `
            <button class="px-[7px] flex flex-row justify-center w-[120px] 
              ${this.improveUX ? (i % this.step == 0 ? 'bg-blue-600':'bg-gray-700') : 'bg-gray-700'} 
              text-white rounded-md m-[5px] p-[3px] border-2 border-transparent
              hover:border-black" title="${i}" id="btn-${i}">
              <span class='material-icons' title='${i}'>thumb_up</span>\
            </button>`
        };

        retVal += `</div>`
        return retVal;
    }
}
