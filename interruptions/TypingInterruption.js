class TypingInterruption {
    constructor(improveUX = true) {
        this.html = null;
        this.inputs = null;
        this.improveUX = improveUX; // Used to determine if we include HCI improvements
        this.words = ["apple", "orange", "apricot", "banana", "acorn", "squash"];
        this.clipboard = '';
        this.init();
    }

    init() {
        this.html = this.renderTemplate();
    }

    renderTemplate() {
        let template = document.createElement('template');
        // TODO: Prevent right-clicking so user can't copy/paste by default
        let content = `
            <div id="interruption-inner-container"
                class="flex m-0 mx-auto justify-center align-center h-full flex-col w-[400px]">
                <h1 class="text-center"><b>Type the words on the left in the boxes on the right</b></h1>
                ${this.improveUX ? "\
                    <p class='text-center'><i>Copy/Paste buttons can move text faster</i></p>" : ""}
                ${this.buildInputs()}
            </div>
        `.trim()

        template.innerHTML = content;
        // Setup a listener to update the score next to each
        // slider whenenver it changes
        let inputs = template.content.querySelectorAll("input[type='text']");
        inputs.forEach(input => input.oninput = (e) => this.updateVal(e));
        this.inputs = inputs;

        // Set up the copy buttons:
        let cpBtns = template.content.querySelectorAll(".copy-btn");
        cpBtns.forEach(b => b.onclick = (e) => this.clipboard = e.target.title);

        let pstBtns = template.content.querySelectorAll(".paste-btn");
        pstBtns.forEach(b => b.onclick = (e) => {
            let inputField = document.getElementById(e.target.title);
            inputField.value = this.clipboard;
            // dispatch an event so it triggers the validity check
            inputField.dispatchEvent(new Event('input')); 
        });

        return template;
    }

    updateVal(e) {
        // Verify that they've typed the full word
        let allFields = document.querySelectorAll("input[type='text']")
        let count = 0;

        allFields.forEach(field => {
            let label = document.getElementById(`${field.id}-val`).querySelector('span').innerText;
            if (field.value == label) {
                count++;
            }
        })
        if (count == allFields.length) { hideInterruption() }
    }

    buildInputs() {
        let retVal = '';
        // Get a list of 3 random numbers from 0-5:
        let choices = Array.from(Array(3)).map(x => Math.floor(Math.random() * 6));

        choices.forEach((choice, i) => {
            retVal += `
            <div class="flex flex-row flex-wrap content-center align-center items-center mb-2 mt-2">
              <label for="s${i}" id="s${i}-val" class="px-[7px] flex flex-row items-center
              w-[110px] bg-zinc-500 text-white rounded-md m-0 mx-auto
              p-[3px] flex justify-between"><span>${this.words[choice]}</span>
                ${this.improveUX ? `\
                  <button class='hover:shadow-lg copy-btn rounded-md bg-white text-zinc-500 mx-[5px] px-[8px] pb-[2px] flex content-center align-center'\
                    title='${this.words[choice]}'>\
                  <span class='material-icons' title='${this.words[choice]}'>content_copy</span>\
                </button>` : ""}
              </label>
              <input id="s${i}" 
                     type="text"
                     oninput="updateVal(this)"
                     class="w-[calc(100%-180px)] border border-zinc-500 rounded-md
                     mx-[10px]">
              ${this.improveUX ? `\
                <button class='hover:shadow-lg paste-btn rounded-md text-zinc-500 mx-[5px] \
                px-[8px] pb-[2px] flex content-center align-center' title='s${i}'>\
                <span class='material-icons' title='s${i}'>content_paste</span>\
              </button>` : ""}
              </label>
            `
        });
        return retVal;
    }
}
