class ArrangementInterruption {
    constructor(improveUX = false) {
        this.html = null;
        this.improveUX = improveUX; // Used to determine if we include HCI improvements
        // rand multiple of 45 from 45-360
        this.targetAngle = 45 * (Math.floor(Math.random() * 7) + 1);
        this.degText = null;
        this.mouseIsDown = false;
        this.div = null;
        this.isActive = true;
        this.init();
    }

    init() {
        this.html = this.renderTemplate();

        // Listen for mousedown so we can track position:
        document.addEventListener('mousedown', (e) => {
            if (!this.isActive) { return; }
            this.mouseIsDown = true;
            this.div = document.getElementById('resize-this');
            this.degText = document.getElementById('degree-text');
        })
        document.addEventListener('mouseup', (e) => {
            if (!this.isActive) { return; }
            this.mouseIsDown = false;
        })
        document.addEventListener('mousemove', (e) => {
            if (!this.isActive) { return; }
            if (this.mouseIsDown) {
                let rect = this.div.getBoundingClientRect();
                let deg;

                deg = Math.trunc(this.getAngleDegrees(rect.x, rect.y, e.clientX, e.clientY));
                this.div.style.transform = `rotate(${deg}deg)`;
                this.degText.innerText = deg;
                if (deg == this.targetAngle) {
                    // isActive is a hack that lets us disable the document-wide
                    // event listeners when we finish up without actually having
                    // to remove them. TODO: actually remove listeners...
                    this.isActive = false;
                    hideInterruption();
                }
            }
        });
    }

    // Calculate angle between two points
    // https://stackoverflow.com/questions/59903415/how-do-i-calculate-the-angle-between-two-points
    getAngleDegrees(fromX, fromY, toX, toY, force360 = true) {
        let deltaX = fromX - toX;
        let deltaY = fromY - toY;
        let radians = Math.atan2(deltaY, deltaX)
        let degrees = ((radians * 180) / Math.PI) - 90;
        if (force360) {
            degrees = (degrees + 360) % 360;
        }
        return degrees;
    }

    renderTemplate() {
        let template = document.createElement('template');
        let content = `
            <div id="interruption-inner-container"
                class="flex m-0 mx-auto justify-center align-center items-center h-full flex-col w-[400px] select-none">
                <h1 class="text-center"><b>Rotate the rectangle ${this.targetAngle} degrees</b></h1>
                <div class="drag-rotate mt-[15px]">
                    <div class='w-[200px] h-[200px] border-2 border-zinc-300 flex items-center justify-center content-center rounded-full'>
                        <div id='resize-this' class='w-[75px] h-[75px] bg-zinc-500 rounded-md rotate-0'>
                            <span class='material-icons absolute text-blue-500 cursor-pointer mt-[-40px] ml-[calc(50%_-_12px)]' id='handle'>
                                arrow_upward
                            </span>
                        </div>
                    </div>
                    <p class='text-zinc-500 w-full text-center' id='degree-text'>0</p>
                </div>
            </div>
        `.trim()

        template.innerHTML = content;

        return template;
    }
}