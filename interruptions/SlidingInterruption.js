class SlidingInterruption {
  constructor(improveUX = false) {
    this.html = null;
    this.allSliders = null;
    this.targetValue = Math.floor(Math.random() * 99) + 1; // value from 1-100
    this.improveUX = improveUX; // Used to determine if we include HCI improvements
    this.init();
  }

  init() {
    this.html = this.renderTemplate();
  }

  renderTemplate() {
    let template = document.createElement('template');
    let content = `
    <div id="interruption-inner-container"
         class="flex m-0 mx-auto justify-center align-center h-full flex-col w-[400px]">
         <h1 class="text-center"><b>Set all sliders to ${this.targetValue}</b></h1>
         <p class="text-center"><i>Up/Down arrow keys can be used to change value</i></p>
         ${this.improveUX ? "\
         <div class='flex flex-row items-center align-center w-[115px] bg-blue-600 rounded-md text-white m-0 mx-auto mt-[15px]'>\
          <input name='link-checkbox' id='link-checkbox' class='mx-[5px]' type='checkbox' />\
          <label for='link-checkbox'>Link sliders</label>\
        </div>": ''}
         ${this.buildSliders()}
    </div>
    `.trim()

    template.innerHTML = content;
    // Setup a listener to update the score next to each
    // slider whenenver it changes
    let as = template.content.querySelectorAll("input[type='range']");
    as.forEach(as => as.oninput = (e) => this.updateSliderVal(e));
    this.allSliders = as;

    return template;
  }

  updateSliderVal(e) {
    // Update the view with current slider value:
    document.getElementById(`${e.target.id}-val`).innerText = e.target.value;

    if (this.improveUX) {
      // Check if user has checked the "slide all" option:
      let slideAll = document.getElementById('link-checkbox').checked;
      if (slideAll) {
        this.allSliders.forEach(s => {
          document.getElementById(`${s.id}-val`).innerText = e.target.value;
          s.value = e.target.value
        });
      }
    }

    let count = 0; // Counter of all sliders at target value

    this.allSliders.forEach(s => {
      if (s.value == this.targetValue) { count++ }
    })

    // Check if task is complete: 
    if (count == this.allSliders.length) {
      hideInterruption()
    }
  }

  buildSliders() {
    let retVal = '';
    for (let i = 0; i < 4; i++) {
      retVal += `
      <div class="flex flex-row content-center items-center mb-2 mt-2">
        <input id="s${i}" 
               type="range"
               value="0" 
               class="w-[calc(100%-50px)] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
        <label for="s${i}" id="s${i}-val" class="w-[50px] h-[30px] block text-sm font-medium text-gray-700 flex items-center justify-center">0</label>
      </div>
    `
    }
    return retVal;
  }
}
