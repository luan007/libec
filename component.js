const observable = require('./util-observer-patched.js');
const yaml = require('js-yaml');
const nanoId = require('nanoId');

import { id_gen } from "./util";

import { Entity } from "./entity";
import { World } from "./world";

export class Component {

    /**
     * Returns [Direct] access of component's registered variables for quicker access
     * @template T 
     * @param {T} instance
     * @returns {T} 
     */
    static direct(instance) {
        return instance.direct;
    }

    /**
     * @template T
     * @param {new ()=>T} type 
     * @returns {T}
     */
    getComponent(type) {
        return this.entity.getComponent(type);
    }

    constructor(params) {
        var id = null;
        params = params || {};
        if (typeof (params) == 'string') {
            id = params;
        }
        else if (params.id) {
            id = params.id;
        }

        /**
         * @type {World} 
         */
        this.world = null;

        /**
         * @type {Entity} 
         */
        this.entity = null;
        // this.__proto__._serializer = this.__proto__._serializer || {}; //this is NOT optimized, and should not be!
        // this.__proto__._meta = this.__proto__._meta || {};
        this.__proto__.direct = this.__proto__.direct || {};

        this.constructor.runtime_name = this.constructor.runtime_name || (this.constructor.name + "_" + nanoId.nanoid(5));

        //default
        this.constructor.registered_name = this.constructor.name;

        this.id = this.value("id", id || id_gen(this.constructor.name)); //pure
        this._destroyed = false;

        this.lastUpdate = 0;
        this.throttleDeltaTime = 0; //disabled
        this.throttleSkipFrames = 0; //disabled
        // this.throttleFrameBudget = 0; //disabled
        this.loop = true;
        this.awoken = false;
    }

    base_awake() {
        if (this.awoken) return true;
        if (!this.awake()) {
            this.awoken = true;
            return true;
        }
        return false;
    }

    base_update() {
        this.lastUpdate = Date.now();
        this.update();
    }

    base_destroy() {
        if (this.entity) {
            this.entity.dirty = true;
        }
        this.destroy();
        this._destroyed = true; //teardown!
    }

    //serialize this component into json
    toJSON() {
        var result = JSON.parse(JSON.stringify(this._serializer));
        result.type = this.constructor.registered_name;
        return result;
    }

    toYAML() {
        var t = this.toJSON();
        delete t.id;
        return t;
    }

    /**
     * this kind of cheats in many way - fools the compiler / vscode
     * @template T
     * @param {T} v 
     * @returns {T}
     */
    value(key, v, m = {}) {
        //one time only

        this.__proto__._meta = this.__proto__._meta || {};
        this.__proto__._meta[key] = m; //warning, this meta should NOT change

        if (!m.watch) {
            //nothing!

            !Object.getOwnPropertyDescriptor(this.__proto__.direct, key) && Object.defineProperty(this.__proto__.direct, key, {
                get: function () {
                    console.warn("You're using Direct Access on a native property, this will be slower than expected.")
                    return this[m];
                },
                set: function (v) {
                    console.warn("You're using Direct Access on a native property, this will be slower than expected.")
                    this[m] = v
                }
            });
        }
        else if (!m.deep) {
            let _local_closure = v; //true value
            !Object.getOwnPropertyDescriptor(this.__proto__, key) && Object.defineProperty(this.__proto__, key, {
                get: function () {
                    return _local_closure;
                },
                set: function (v) {
                    if (v != _local_closure) {
                        this.notify(v);
                    }
                    _local_closure = v;
                }
            })

            !Object.getOwnPropertyDescriptor(this.__proto__.direct, key) && Object.defineProperty(this.__proto__.direct, key, {
                get: function () {
                    return _local_closure;
                },
                set: function (v) {
                    _local_closure = v;
                }
            });

        } else if (m.deep) {
            // this._values[key] = v;
            let obs = observable.Observable.fromX({ value: v });
            let _local_proxy = obs.proxy;
            let _local_closure = obs.target;
            _local_proxy.observe(this.notify.bind(this));
            !Object.getOwnPropertyDescriptor(this.__proto__, key) && Object.defineProperty(this.__proto__, key, {
                get: function () {
                    return _local_closure.value;
                },
                set: function (v) {
                    _local_proxy.value = v;
                }
            })

            !Object.getOwnPropertyDescriptor(this.__proto__.direct, key) && Object.defineProperty(this.__proto__.direct, key, {
                get: function () {
                    return _local_closure.value;
                },
                set: function (v) {
                    _local_closure.value = v;
                }
            });
        }
        //[this] is trustworthy

        this._strap_value(key);
        return v;
        // return;
    }


    /**
     * this kind of cheats in many way - fools the compiler / vscode
     * @template T
     * @param {new () => T} type 
     * @returns {T[]}
     */
    linkArr(key, type, m = {}) {
    }

    /**
     * this kind of cheats in many way - fools the compiler / vscode
     * @template T
     * @param {new () => T} type 
     * @returns {T}
     */
    entityWith(key, type, m = {}) {
        // var name = type.name;

        var query = {};
        this.__proto__._meta = this.__proto__._meta || {};
        this.__proto__._meta[key] = m; //warning, this meta should NOT change

        var instance = null; //just nulling this WILL invalidate
        !Object.getOwnPropertyDescriptor(this.__proto__, key) && Object.defineProperty(this.__proto__, key, {
            get: function () {
                return instance;
            },
            set: function (v) {
                instance = v; //stores instance - instant!
            }
        })
    }

    _strap_value(key) {
        //serialization
        this.__proto__._serializer = this.__proto__._serializer || {}; //this is NOT optimized, and should not be!
        let _this = this;
        !Object.getOwnPropertyDescriptor(this.__proto__._serializer, key) && Object.defineProperty(this.__proto__._serializer, key, {
            get: function () {
                return _this[key]; //slow
            },
            set: function (v) {
                _this[key] = v; //go through the pipe
            },
            enumerable: true
        })
    }



    //life cycle
    destroy() { }

    update() { }

    awake() { }

    notify() { }

}
