import { World, Component, Entity } from "../";
import { vec3, vec2, mat3, mat4 } from "gl-matrix";

import { makeNoise3D } from "open-simplex-noise";
var noise3d = makeNoise3D(0);

var world = new World();


function loop(fn) {
    loop.loopies = loop.loopies || [];
    loop.loopies.push(fn);
}

function run() {
    for (var i = 0; i < loop.loopies.length; i++) {
        loop.loopies[i]();
    }
    requestAnimationFrame(run);
}


class Canvas2DRendererComponent extends Component {
    constructor(params) {
        super(params);
        this.el = this.value("el", "#main", { watch: true });
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d');
        this.parent = null; //default!

        this.height = this.value("height", 600, { watch: true });
        this.width = this.value("width", 600, { watch: true });

        this.dpi = this.value("dpi", window.devicePixelRatio, { watch: true });
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // this.throttleDeltaTime = 300; //300ms
    }

    applyStyles() {
        this.canvas.width = this.width * this.dpi;
        this.canvas.height = this.height * this.dpi;
        this.canvas.style.height = this.height + "px";
        this.canvas.style.width = this.width + "px";
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)"
        this.ctx.fillRect(0, 0, this.width * 1000, this.height * 1000);
    }

    notify() {
        this.needUpdate = true;
        this.applyStyles();
    }

    update() {
        //recover from last frame
        this.ctx.restore();
        this.ctx.save();
        this.ctx.scale(this.dpi, this.dpi);
        //continue on for new one
        this.ctx.globalCompositeOperation = "source-over";
        // this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.0001)"
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.globalCompositeOperation = "lighter";
        if (this.parent == null || this.needUpdate) {
            // not ready?
            this.parent = document.querySelector(this.el); //keep trying?
            if (this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            if (this.parent) {
                this.parent.appendChild(this.canvas);
                this.needUpdate = false;
                this.applyStyles();
            }
        }
    }

    awake() {
    }
}

class TransformComponent extends Component {
    constructor(params) {
        super(params);
        this.position = this.value("position", vec3.create()); //serialized value
        this.rotation = this.value("rotation", vec3.create()); //serialized value
        this.scale = this.value("scale", vec3.create()); //serialized value
    }
}

class RandomWalkComponent extends Component {
    constructor(params) {
        super(params);
        this.vel = this.value("vel", vec3.create());
        this.zero = [0, 0, 0];
        this.scale = this.value("scale", 0.001);
        this.t = 0;
    }

    awake() {
        this.transform = this.getComponent(TransformComponent);
    }

    update() {
        this.t += 0.001;
        vec3.set(this.vel, 1, 0, 0);
        vec3.rotateZ(this.vel, this.vel, this.zero, (noise3d(this.transform.position[0] * 3.01, this.transform.position[1] * 3.01, this.t)) * Math.PI * 2);
        vec3.scaleAndAdd(this.transform.position, this.transform.position, this.vel, this.scale);
    }
}

class BallRenderer extends Component {
    constructor(params) {
        super(params);
        this.rng = Math.random() * 0.2 + 0.2;
        this.canvasEntity = this.value("canvasEntity", "");
    }

    awake() {
        this.target = this.world.getComponentFrom(this.canvasEntity, Canvas2DRendererComponent);
        this.transform = this.getComponent(TransformComponent);
    }

    update() {
        var ctx = this.target.ctx;
        ctx.fillStyle = "rgba(14,150, 200, " + this.rng + ")"
        ctx.fillRect(this.target.width * this.transform.position[0], this.target.width * this.transform.position[1], 1, 1);
    }
}

class InputComponent extends Component {
    constructor(params) {
        super(params);
        this.mouseX = 0.0001;
        this.mouseY = 0.0001;
        this.el = this.value("el", "", { watch: true });
        this.element = null;

        this.needChange = true;

        this.ev_mousemove = (e) => {
            this.mouseX = e.offsetX / this.element.clientWidth;
            this.mouseY = e.offsetY / this.element.clientHeight;
        }

        this.throttleSkipFrames = 10;
    }

    attachToElement() {
        if (this.needChange) {
            if (this.element) {
                this.element.removeEventListener("mousemove", this.ev_mousemove);
            }
            this.element = document.querySelector(this.el);
            if (this.element) {
                this.element.addEventListener("mousemove", this.ev_mousemove);
                this.needChange = false;
            }
        }
    }

    notify() {
        this.needChange = true;
    }

    update() {
        this.attachToElement();
    }

    awake() {
        this.attachToElement();
    }
}

class BallSpawner extends Component {
    constructor(params) {
        super(params);
        this.canvasEntity = this.value("canvasEntity", "Main");
        this.count = this.value("count", 550);
    }
    awake() {
        for (var i = 0; i < this.count; i++) {
            world.runtimeEntity()
                .component(TransformComponent, null, (transform) => {
                    transform.position[0] = (Math.random());
                    transform.position[1] = (Math.random());
                })
                .component(RandomWalkComponent)
                .component(BallRenderer, null, (renderer) => {
                    renderer.canvasEntity = this.canvasEntity;
                })
        }
    }
    update() {

    }
}

class FollowMouse extends Component {
    constructor(params) {
        super(params);
        this.inputKey = this.value("inputKey", "");
        this.v = [0.1, 0.1];
        this.empty = [1, 0];
    }
    awake() {
        this.transform = this.getComponent(TransformComponent);
        this.input = world.getComponentFrom(this.inputKey, InputComponent);
    }
    update() {
        this.v[0] = (this.input.mouseX - this.transform.position[0]) * 0.01;
        this.v[1] = (this.input.mouseY - this.transform.position[1]) * 0.01;
        this.transform.position[0] += this.v[0];
        this.transform.position[1] += this.v[1];
        this.transform.rotation.z = vec2.angle(this.v, this.empty);
    }
}

class DrawBall extends Component {
    constructor(params) {
        super(params);
        this.canvasEntity = this.value("canvasEntity", "");
    }

    awake() {
        this.canvas = world.getEntity(this.canvasEntity).getComponent(Canvas2DRendererComponent);
        this.ctx = this.canvas.ctx;
        this.transform = this.getComponent(TransformComponent);
    }

    update() {
        var ctx = this.ctx;
        ctx.fillStyle = "rgb(222, 5, 1)"
        ctx.save();
        ctx.translate(this.transform.position[0] * this.canvas.width, this.transform.position[1] * this.canvas.height);
        ctx.rotate(this.transform.rotation.z)
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
    }
}


loop(() => {
    world.update();
});
run();


world
    .entity("Main")
    .component(Canvas2DRendererComponent, "test", (c) => { c.el = "#main" })
    .component(InputComponent, null, (c) => { c.el = "#main > canvas" });


// for (var i = 0; i < 100; i++) {
//     world
//         .runtimeEntity()
//         .component(TransformComponent, null, (t) => {
//             t.position[0] = Math.random();
//             t.position[1] = Math.random();
//         })
//         .component(FollowMouse, null, (r) => { r.inputKey = "Main" })
//         .component(RandomWalkComponent)
//         .component(DrawBall, null, (r) => { r.canvasEntity = "Main" })
// }

world
    .entity("Spawner")
    .component(BallSpawner);
