(function(global) {

    // 'use strict';
  
    // var fabric = global.fabric || (global.fabric = { });
  
    // if (global.hiDraw) {
    //   fabric.warn('hiDraw is already defined');
    //   return;
    // }


hiDraw.prototype.viewEvent = (function () {
    var viewEvent = function () {
        // object:removed
        var that = this;
        this.canvasView.off('object:added');
        this.canvasView.on('object:added', function (opt) {
            if(that.defaultOptions.openEventHistory &&
               that.historySaveAction &&
               !opt.target.tempDrawShape){that.historySaveAction()}
            // console.log('***', opt, opt.target, opt.target.get('type'))
            // that.canvasView.toJSON(['label', 'uniqueIndex']) // 添加客製屬性置JSON中
            // document.getElementById(that.defaultOptions.viewJsonTextId).value = JSON.stringify(that.canvasView.toJSON(['label', 'uniqueIndex']));
            // that.canvasView.loadFromJSON()
            if (that.defaultOptions.event && that.defaultOptions.event['object_added']) {
                that.defaultOptions.event['object_added'](opt)
            }
        });
        
        this.canvasView.off('object:modified');
        this.canvasView.on('object:modified', function (opt) {
            if(that.defaultOptions.openEventHistory &&
               that.historySaveAction &&
               !opt.target.tempDrawShape){that.historySaveAction()}
            if (that.defaultOptions.event && that.defaultOptions.event['object_modified']) {
                that.defaultOptions.event['object_modified'](opt)
            }
        });

        this.canvasView.off('object:removed');
        this.canvasView.on('object:removed', function (opt) {
            if(that.defaultOptions.openEventHistory &&
               that.historySaveAction &&
               !opt.target.tempDrawShape){that.historySaveAction()}
            if (opt.target && opt.target.hiDrawEvnt && typeof(opt.target.hiDrawEvnt.objRemove) === 'function') {
                opt.target.hiDrawEvnt.objRemove(opt)
            }
            if (that.defaultOptions.event && that.defaultOptions.event['object_removed']) {
                that.defaultOptions.event['object_removed'](opt)
            }
        });
        this.canvasView.on('after:render', function (opt) {
            if (that.defaultOptions.event && that.defaultOptions.event['after_render']) {
                that.defaultOptions.event['after_render'](opt)
            }
        });
        // this.canvasView.on('selection:updated', function (event) {
        //     //activeObject = canvas.getActiveObject()
        // });
        this.canvasView.on('mouse:wheel', function (opt) {
            var delta = opt.e.deltaY;
            if (that.defaultOptions.objectDefault.eventCtrl.mouse_wheel_default_behavior) {
                var zoom = that.canvasView.getZoom();
                console.log('delta', delta)
                zoom *= 0.999 ** delta;
                // zoom = zoom - 0.2 * delta / 100;
                if (zoom > 64) zoom = that.defaultOptions.objectDefault.eventCtrl.zoomMax;
                if (zoom < 0.01) zoom = that.defaultOptions.objectDefault.eventCtrl.zoomMin;
                // if (zoom < 1) zoom = 1;
                // this.setZoom(zoom);
                this.zoomToPoint({
                    x: opt.e.offsetX,
                    y: opt.e.offsetY
                }, zoom);
            }
             // updateMiniMapVP();
            // that.canvasView.forEachObject(function(o) {
            //     o.setCoords();
            // });
            if (that.defaultOptions.showGridAxis) { that.BgGrid(true) }
            opt.e.preventDefault();
            opt.e.stopPropagation();
            // that.canvasView.renderAll();
            if (that.defaultOptions.event && that.defaultOptions.event['mouse_wheel']) {
                that.defaultOptions.event['mouse_wheel'](opt)
            }
        });

        
        this.canvasView.on('mouse:down', function (opt) {
            var evt = opt.e;
            if (that.defaultOptions.objectDefault.eventCtrl.mouse_down_default_behavior) {
                if (evt.altKey === true || that.defaultOptions.panCanvas) {
                    this.isDragging = true;
                    this.selection = false;
                    this.lastPosX = evt.clientX;
                    this.lastPosY = evt.clientY;
                }
                // console.log('mouse down',opt.target? opt.target.get('type'): opt)
                that.deselectPolygons(opt.target)
            }
            if (that.defaultOptions.event && that.defaultOptions.event['mouse_down']) {
                that.defaultOptions.event['mouse_down'](opt)
            }
        });
        this.canvasView.on('mouse:move', function (opt) {
            var e = opt.e;
            if (that.defaultOptions.objectDefault.eventCtrl.mouse_move_default_behavior) {
                if (this.isDragging) {
                    var vpt = this.viewportTransform;
                    vpt[4] += e.clientX - this.lastPosX;
                    vpt[5] += e.clientY - this.lastPosY;
                    this.requestRenderAll();
                    // updateMiniMapVP();
                    this.lastPosX = e.clientX;
                    this.lastPosY = e.clientY;
                    if (that.defaultOptions.showGridAxis) { that.BgGrid(true) }
                }
            }
            // canvas coordinate 
            // var pointer = that.canvasView.getPointer(e);
            // var posX = pointer.x;
            // var posY = pointer.y;
            // console.log('x:', e.clientX, posX, 'y:', e.clientY, posY)
            if (that.defaultOptions.event && that.defaultOptions.event['mouse_move']) {
                that.defaultOptions.event['mouse_move'](opt)
            }
        });
        this.canvasView.on('mouse:up', function (opt) {
            if (that.defaultOptions.objectDefault.eventCtrl.mouse_up_default_behavior) {
                this.setViewportTransform(this.viewportTransform);
                this.isDragging = false;
                this.selection = true;
            }
            // that.defaultOptions.panCanvas = false;
            if (that.defaultOptions.event && that.defaultOptions.event['mouse_up']) {
                that.defaultOptions.event['mouse_up'](opt)
            }
        });
        
        this.canvasView.on('selection:created', function (opt) {
            // console.log('selection:created',opt.target? opt.target.get('type'): opt)
            if (opt.target) {
                // 與群組選擇有關 (urgent)
                // if(opt.target.get('type') === 'activeSelection') {
                //     that.canvasView.discardActiveObject();
                //     return 
                // }
                if (checkDrawingType(opt.target.get('type'))) {
                    // console.log(
                    //     opt.target.get('type'),
                    //     opt.target.get('name'),
                    //     opt.target.get('label'),
                    //     opt.target.get('stroke')
                    // )
                }
                if (opt.target.get('type') == 'polygon') {
                    // opt.target.controls = controlOverride.polygon(opt.target)
                } else if (opt.target.get('type') == 'polyline') {
                    // opt.target.controls = controlOverride.polyline(opt.target)
                } else { }
                that.canvasView.bringToFront(opt.target);
            }
            if (that.defaultOptions.event && that.defaultOptions.event['selection_created']) {
                that.defaultOptions.event['selection_created'](opt)
            }
        });

        this.canvasView.on('selection:updated', function (opt) {
            if (opt.target) {
                if (checkDrawingType(opt.target.get('type'))) {
                    // console.log(
                    //     opt.target.get('type'),
                    //     opt.target.get('name'),
                    //     opt.target.get('label'),
                    //     opt.target.get('stroke')
                    // )
                }
                if (opt.target.get('type') == 'polygon') {
                    // opt.target.controls = controlOverride.polygon(opt.target)
                } else if (opt.target.get('type') == 'polyline') {
                    // opt.target.controls = controlOverride.polyline(opt.target)
                } else { }
                that.canvasView.bringToFront(opt.target);
            }
            if (that.defaultOptions.event && that.defaultOptions.event['selection_updated']) {
                that.defaultOptions.event['selection_updated'](opt)
            }
        });
        this.canvasView.on('selection:cleared', function (opt) {
            if (that.defaultOptions.event && that.defaultOptions.event['selection_cleared']) {
                that.defaultOptions.event['selection_cleared'](opt)
            }
        });

        document.onkeydown = function (event) {
            if(!that || !that.canvasView){
                return false
            }
            // console.log(event)
            if (that.canvasView.cacheCanvasEl) {

            }
            var key;
            if (window.event) {
                key = window.event.keyCode;
            } else {
                key = event.keyCode;
            }
            if (key == 27) {
                that.canvasView.forEachObject(function (obj) {
                    if (obj['tempDrawShape']) {
                        that.canvasView.remove(obj)
                    }
                })
                that.canvasView.renderAll();
                that.removeCanvasEvents();
                that.changeCanvasProperty(true, false);
                that.changeSelectableStatus(true);
            } else if (key == 46) {
                that.delete();
            } else if (key == 67) {
                if (event.ctrlKey) {
                    // event.preventDefault();
                    that.copy();
                }
            } else if (key == 86) {
                if (event.ctrlKey) {
                    // event.preventDefault();
                    that.paste();
                }
            }
        }

        return this;
    }

    function checkDrawingType(type) {
        if (type == 'polygon' ||
            type == 'polyline' ||
            type == 'circle' ||
            type == 'rectangle' ||
            type == 'line') {
            return true;
        } else {
            return false;
        }
    }

    return viewEvent;
}(this))


})(typeof exports !== 'undefined' ? exports : this);