# libec
minimal entity-component lib for webgl related dev

biased & personal, & in most case you won't be using this & should not care..

consider this as a story / fun read. lol


## please check /demos for usage
---
![capture](demos/capture.png)

---

# Why?
| Too many frameworks, too hard to write reusable, managable code. (at least true for me)


---

## 1. picking 'genre'

'new' features of the web (i.e webgl, wasm, raf, worker & so on) enables multiple genres of js-programming, 

as a developer overdosed with data-viz / art installation projects, these boil down to 2 major types:

`reactive` / `loop`

reactive - where user input events drive the app, a more 'web' like dev & user experience.

loop - based from requestAnimationFrame, usually related to canvas-based rendering, when doing so, you're basically doing it the `game` way.


**in real life**

those two genre of code usually get mixed together, and the developer must make a choice - to pick one and then `encapsulate` the other.

**example**:

make Vue the main 'framework' of choice, make your canvas animation within one big vue-component.

your Vue code stays rather reusable but canvas ones don't.


---

Choosing the 'right genre' also takes up a big chunk of time, and usually leads to ton of regret later on.

for me, there's no `easy & correct genre`... 

---

## 2. stitching 'structures'

stateless `canvas` / `p5.js` .., stateful `DOM`, graph like `three.js`, or other tree like `fabric.js` ...

each one living inside its happy little house.

not too happy on my side though, stitching them can be painful..
AND

this usually gets `ugly` quite fast, 

**example** 

building a model turn table,

you have many `pin` data + `model definition` stored in a lovely `yaml`.

`pin` can be attached to any `part` of your `model` (object or group) and should remain to a `relative position` of the `part`.

---

later, these `pin` binds to some vue components called `Pin` (obviously..)

and your model is loaded via `three`.

your app is rather game-alike, so very thing is managed the `three` way, parenting.. grouping & so on.

then you created a `data structure` which generates all `pin` in `Vue` world, but each pin requires a `absolute screen position` to render correctly.

linking `objects3d` to `vue-data` is a straight forward way to deal with this, but should be considered 'ugly' and not 'pure', also - where should you do all the 'screen position calculations'? inside the component or some where in your loop?

after all this though, it works, and those stitching made the code look like a bowl of sticky crap sauce, where `all parts are kind of connected` which makes the code not reusable in other projects.

not ideal..



# Now

I've got a project-free week. and this repo = my attempt to find a better way to code these sort of stuff.

- build components. not vue component or threejs scripts.
- serialization / 'field extraction' as an enforced coding style
- use any library within the component, and enjoy its own-genre there
- stay rather performant, i'm not an expert on this, but i'll try

**GOAL**

DUMB = HAPPINESS:

I won't **think** which way is the best way to start coding my project.

TEAM WORK:

design-team will be able to grab **components** and **config** them on the fly, and export data which **applies** back to the project, with **yaml**.



----

Still in active development (during projects) - 

lots of features are missing.


## Why not pure ECS like ECSY / Unity DOTS?
---
Pure ECS requires **brain**, 

which I'm lack of, esp during projects, simply too much pressure on me..

But it is planned.


## Why no parent structure on entities like in Unity?
---
In threejs, object parent is maintained in scene-graph, 

In Vue / React.. you know the DOM deal

Pixi.js / Fabric.js have there own parenting schemes.. 

There're two places you may want to use parenting features:

1. Transform related / in godot terms: `spacial`

2. Grouping, control multiple objects in a tree-like structure (toggling them together & so on)

Sadly the current goal of this project is NOT a framework, but a bridge which connects them in a brainless manner, and features above have been implemented in many frameworks you will be connecting (or using), thus not included in the package.

& current code base is tiny, and I'm doing profiling down to every single line so the performance impact stays minimal.


## Some notes
---

When doing particle systems (most tempting idea when it comes to entities), 500~5000 should be fine, if more is needed:

consider write one big SystemComponent & multiple BehaviourComponent, so you can make use of `wasm`, or offload stuff to `gpgpu`. 

automatic parallelism is not goal of this tiny library ;)

if you really need one messy impl on CPU, check out `libao` & its `BlizzardSystem`, it can do 50~60K physical particle-sim at `60fps` on my 19 macbookpro.

