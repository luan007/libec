import { id_gen } from "./util";
import { Entity } from "./entity";
import { Component } from "./component";

export class World {
    /**
     * @type {World}
     */
    static default;
    constructor() {
        /**
         * @type {Array<Entity>}
         */
        this.entities = [];

        /**
         * @type {Array<Component>}
         */
        this.components = [];

        this._entity_cache = {};
        this._comp_cache = {};

        this.now = Date.now();
        this.frames = 0;

        World.default = World.default || this;

        this.e = this.entity;
        this.ce = this.addComponentToEntity;

        this.ge = this.getEntity
        this.gc = this.getComponentFrom;
    }

    toJSON() {
        var obj = {};
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].runtimeOnly) continue;
            var key = this.entities[i].id;
            var val = this.entities[i];
            obj[key] = val.toJSON();
        }
        return obj;
    }

    toYAML() {
        var obj = {};
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].runtimeOnly) continue;
            var key = this.entities[i].id;
            var val = this.entities[i];
            obj[key] = val.toYAML();
        }
        return yaml.dump(obj);
    }

    _item_is_invalid(item, id) {
        return item._destroyed || item.id != id;
    }

    _get_item_from_cache(cache, root, id) {
        if (cache[id]) {
            if (this._item_is_invalid(cache[id], id)) {
                //invalidate cache
                cache[id] = null;
                //id changed? perform search
                for (var i = 0; i < root.length; i++) {
                    if (root[i].id == id && !root[i]._destroyed) {
                        cache[id] = root[i];
                        return cache[id];
                    }
                }
                return null;
            }
            else {
                return cache[id];
            }
        }
        return null;
    }

    /**
     * @returns {Component} 
     */
    getComponent(id) {
        return this._get_item_from_cache(this._comp_cache, this.components, id);
    }

    /**
     * @template T
     * @param {*} entity_id 
     * @param {new ()=>T} type 
     * @returns {T}
     */
    getComponentFrom(entity_id, type) {
        var e = this.getEntity(entity_id);
        if (!e) return undefined;
        return e.getComponent(type);
    }

    /**
     * @returns {Entity} 
     */
    getEntity(id) {
        return this._get_item_from_cache(this._entity_cache, this.entities, id);
    }

    /**
     * 
     * @param {Entity} e 
     */
    addEntity(e) {
        if (this.entities.indexOf(e) == -1) {
            e.world = this;
            this.entities.push(e);
            this._entity_cache[e.id] = e;
        }
    }


    addComponentToEntity(cType, e, params, initFn) {
        var comp = new cType(params);
        comp.entity = e;
        comp.world = this;
        this.components.push(comp);
        this._comp_cache[comp.id] = comp;
        initFn(comp);

        // var handle = setTimeout(() => {
        //     clearTimeout(handle);
        //     comp.base_awake();
        // }, 0);
        return comp;
    }

    entity(id) {
        var e = new Entity(id);
        this.addEntity(e);
        return e;
    }

    runtimeEntity(id) {
        var e = new Entity(id);
        this.addEntity(e);
        e.runtimeOnly = true;
        return e;
    }

    async update() {
        this.now = Date.now();
        this.frames++;
        for (var i = 0; i < this.components.length; i++) {
            let comp = this.components[i]
            if (!comp) continue;
            if (comp._destroyed) {
                this._cleanComponent(i);
            }
            if (!comp.awoken) {
                let result = true;
                result = await comp.base_awake(); //check next round?
                if (!result) {
                    if(comp.block) {
                        return;
                    }
                    continue; //skip or kill
                }
                //good to go!
            }
            if (!comp.loop) continue; //no loop!
            if (comp.throttleSkipFrames) {
                (this.frames % comp.throttleSkipFrames) == 0 && comp.base_update();
            }
            else if (comp.throttleDeltaTime) {
                if (this.now - comp.lastUpdate > comp.throttleDeltaTime) {
                    comp.base_update();
                }
            }
            else {
                comp.base_update();
            }
        }
        for (var i = 0; i < this.entities.length; i++) {
            if (!this.entities[i]) continue;
            if (this.entities[i].dirty) {
                this.entities[i]._rebuild_component_map();
            }
        }
    }

    destroyComponent(comp) {
        comp.base_destroy();
        comp._destroyed = true;
    }

    destroyEntity(entity) {
        var id = this.entities.indexOf(entity);
        if (id == -1) return false;
        entity.base_destroy();
        for (var i = 0; i < entity.components.length; i++) {
            this.destroyComponent(entity.components[i]);
        }
        entity._destroyed = true;
        this.entities[id] = null;
    }

    _cleanComponent(i) {
        var c = this.components[i];
        if (c.entity) {
            c.entity.dirty = true;
        }
        c.world = null;
        c.entity = null;
        this.components[i] = null;
    }
}


export var world = new World();