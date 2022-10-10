class SlidingInterruption {
  constructor() {
    this.html = null;
    this.allSliders = null;
    this.targetValue = Math.floor(Math.random() * 100);
    this.init();
  }

  init() {
    this.html = this.renderTemplate();
  }

  renderTemplate() {
    let template = document.createElement('template');
    let content = `
    <div id="interruption-inner-container"
         class="flex m-0 mx-auto justify-center align-center w-full flex-col w-[300px]">
         <h1>Set all sliders to ${this.targetValue}</h1>
         ${this.buildSliders()}
    </div>
    `.trim()

    template.innerHTML = content;
    // Setup a listener to update the score next to each
    // slider whenenver it changes
    let as = template.content.querySelectorAll("input");
    as.forEach(as => as.oninput = (e) => this.updateSliderVal(e));
    this.allSliders = as;

    return template;
  }

  updateSliderVal(e) {
    // Update the view with current slider value:
    document.getElementById(`${e.target.id}-val`).innerText = e.target.value;

    let count = 0; // Counter of all sliders at target value

    this.allSliders.forEach(s => {
      if (s.value == this.targetValue) {count++}
    })

    // Check if task is complete: 
    if (count == this.allSliders.length) {
      // TODO: Big animated checkbox?
      hideInterruption()
    }
  }

  buildSliders() {
    let retVal = '';
    for (let i=0; i<5; i++) {
      retVal += `
      <div class="flex flex-row content-center items-center mb-2 mt-2">
        <input id="s${i}" 
               type="range"
               value="0" 
               class="w-[calc(100%-50px)] h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer">
        <label for="s${i}" id="s${i}-val" class="w-[50px] h-[30px] block text-sm font-medium text-zinc-800 flex items-center"></label>
      </div>
    `
    }
    return retVal;
  }
}
