import { id_gen } from "./util";
import { Component } from "./component";
import { World } from "./world";

export class Entity {
    constructor(params) {
        if (typeof (params) == 'string') {
            params = {
                id: params
            }
        }
        params = params || {};

        /**
         * @type {World} 
         */
        this.world = null;
        this.runtimeOnly = false;
        this.dirty = false;
        this._destroyed = false;

        /**
         * @type {Array<Component>} 
         */
        this.components = []; //simple list = better 

        this.componentMap = {}; //way better than map, don't know why?
        this.id = params.id || id_gen("Entity");

        this.c = this.component;
    }

    toJSON() {
        if (this.runtimeOnly) return;
        var comps = [];
        for (var i = 0; i < this.components.length; i++) {
            comps.push(
                this.components[i].toJSON()
            )
        }
        return comps;
    }


    toYAML() {
        if (this.runtimeOnly) return;
        var comps = [];
        for (var i = 0; i < this.components.length; i++) {
            var f = this.components[i].toYAML();
            var obj = {};
            obj[f.type] = f;
            delete f.type;
            comps.push(obj);
        }
        return comps;
    }

    update(t) {
        for (var i = this.components.length - 1; i >= 0; i--) {
            this.components[i].update(t);
        }
    }

    base_destroy() {
    }

    /**
     * @template T
     * @template Q
     * @param {new (param:Q) => T} cType 
     * @param {Q} params
     * @param {(comp: T)=>any} init 
     */
    component(cType, params, init = (comp) => { /**does nothing */ }) {
        var comp = this.world.addComponentToEntity(cType, this, params, init);
        this.components.push(comp);
        this.componentMap[cType.runtime_name] = comp;
        return this;
    }

    /**
     * @template T
     * @param {new () => T} cType 
     * @returns {T}
     */
    getComponent(cType) {
        return this.componentMap[cType.runtime_name];
    }

    hasComponent(cType) {
        return !!this.componentMap[cType.runtime_name];
    }

    hasComponentInstance(cInstance) {
        return this.components.indexOf(cInstance) >= 0;
    }

    _rebuild_component_map() {
        this.componentMap = {};
        var new_list = [];

        for (var i = 0; i < this.components.length; i++) {
            if (!this.components[i]._destroyed) {
                new_list.push(this.components[i]);
                this.componentMap[this.components[i].constructor.runtime_name] = new_list[new_list.length - 1]; //rebuilt!
            }
        }
        this.components = new_list;
        this.dirty = false;
    }

    /**
     * @template T
     * @param {(new () => T | T)} cType_or_cInstance 
     */
    destroyComponent(cType_or_cInstance) {
        if (this.hasComponentInstance(cType_or_cInstance)) {
            this.world.destroyComponent(cType_or_cInstance);
            this._rebuild_component_map();
        }
        else {
            while (this.getComponent(cType_or_cInstance)) {
                this.world.destroyComponent(this.getComponent(cType_or_cInstance))
                this._rebuild_component_map();
            }
        }
    }
}
