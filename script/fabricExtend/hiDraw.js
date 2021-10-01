(function (global) {

  // 'use strict';

  var fabric = global.fabric || (global.fabric = {});

  if (global.hiDraw) {
    fabric.warn('hiDraw is already defined');
    return;
  }

  function hiDraw(options) {
    if (!fabric) {
      console.log('lib fabric not exist');
      return false;
    }
    if (this.historyInit) {
      this.historyInit()
    }
    this.defaultOptions = {
      canvasViewId: 'mainEditor',
      activeJsonTextId: 'hiActiveJsonArea',
      canvasWidth: 500,
      canvasHeight: 500,
      showGridAxis: false,
      gridAxis: {
        canvasId: 'tempaxis'
      },
      objectDefault: {
        fillColor: 'rgba(0,0,0,0)',
        strokeColor: 'rgba(51,51,51,1)',
        strokeWidth: 3,
        fillAlpha: 0,
        eventCtrl: {
          mouse_wheel_default_behavior: true,
          mouse_down_default_behavior: true,
          mouse_move_default_behavior: true,
          mouse_up_default_behavior: true,
          zoomMax: 32,
          zoomMin: 0.01
        }
      },
      webglFilter: false,
      openEventHistory: false,
      copyPropertiesToInclude: ['label', 'className']
    }
    if (options) {
      this.defaultOptions = this.mergeDeep(this.defaultOptions, options);
    }
    if (this.fabricOverride) {
      this.fabricOverride.call(this)
    }
    this.labelObjsIndexList = [];

    return this;
  }

  hiDraw.prototype.mergeDeep = function (target, source) {
    if (typeof target !== 'object' || typeof source !== 'object') return target;
    for (var prop in source) {
      if (!source.hasOwnProperty(prop)) continue;
      if (prop in target) {
        if (typeof target[prop] !== 'object') {
          target[prop] = source[prop];
        } else {
          if (typeof source[prop] !== 'object') {
            target[prop] = source[prop];
          } else {
            // if(target[prop].concat && source[prop].concat) {
            //   target[prop] = target[prop].concat(source[prop]);
            // } else {
            //   target[prop] = this.mergeDeep(target[prop], source[prop]); 
            // } 
            target[prop] = this.mergeDeep(target[prop], source[prop]);
          }
        }
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  }


  hiDraw.prototype.createView = function () {
    var that = this;
    var elem = document.getElementById(this.defaultOptions.canvasViewId);
    this.canvasView = new fabric.Canvas(this.defaultOptions.canvasViewId, {
      // height: window.innerHeight - 50, // 讓畫布同視窗大小
      // width: window.innerWidth - 50, // 讓畫布同視窗大小
      // height: elem.offsetHeight, // 讓畫布同視窗大小
      // width: elem.offsetWidth, // 讓畫布同視窗大小
      height: that.defaultOptions.canvasHeight, // 讓畫布同視窗大小
      width: that.defaultOptions.canvasWidth, // 讓畫布同視窗大小
      isDrawingMode: false, // 設置成 true 一秒變身小畫家
      hoverCursor: 'pointer', // 移動時鼠標顯示
      freeDrawingCursor: 'all-scroll', // 畫畫模式時鼠標模式
      preserveObjectStacking: true,
      //backgroundColor: 'rgb(255,255,255)' // 背景色,
      fireRightClick: true
    }); //声明画布

    //this.canvasView.setDimensions({width:800, height:200});
    if (that.defaultOptions.webglFilter) {
      var webglBackend;
      try {
        // webgl filter 可能無法解析高解析度圖片，解法修改預設 textureSize
        // 需要在啟動時修改預設 fabric.textureSize = 2048 
        webglBackend = new fabric.WebglFilterBackend();
      } catch (e) {
        console.log(e)
        webglBackend = new fabric.Canvas2dFilterBackend();
      }
      fabric.filterBackend = webglBackend;
    } else {
      fabric.filterBackend = new fabric.Canvas2dFilterBackend();
    }

    // that.fabricObjDefaultOverride({
    //     stroke: that.defaultOptions.strokeColor,
    //     strokeWidth: that.defaultOptions.strokeWidth,
    //     fill: that.colorToRgbA(that.defaultOptions.strokeColor, that.defaultOptions.fillAlpha)
    // })

    return this;
  }

  hiDraw.prototype.changeStatus = function (options) {
    // panCanvas = true/ false
    if (options) {
      this.defaultOptions = this.mergeDeep(this.defaultOptions, options);
    }
  }

  hiDraw.prototype.changeCanvasProperty = function (selValue, drawingVal) {
    this.canvasView.selection = selValue;
    this.canvasView.isDrawingMode = drawingVal;
  }

  hiDraw.prototype.changeAllObjsStatus = function (options) {
    this.canvasView.forEachObject(function (obj) {
      for (key in options) {
        obj[key] = options[key];
        obj.set(key, options[key]);
      }
    })
    this.canvasView.renderAll();
  }

  hiDraw.prototype.changeSelectableStatus = function (val) {
    if (!val) {
      this.canvasView.discardActiveObject();
    }
    this.canvasView.forEachObject(function (obj) {
      obj.selectable = val;
    })
    this.canvasView.renderAll();
  }

  hiDraw.prototype.removeCanvasEvents = function () {
    this.canvasView.off('mouse:down');
    this.canvasView.off('mouse:move');
    this.canvasView.off('mouse:up');
    this.canvasView.off('object:moving');
  }

  hiDraw.prototype.logEachObjects = function () {
    var i = 0;
    this.canvasView.forEachObject(function (obj) {
      obj.set('uniqueIndex', i)
      i++;
    })
  }

  hiDraw.prototype.copyCloneTempObjs = new Array();
  hiDraw.prototype.copy = function () {
    this.copyCloneTempObjs = new Array();
    if (this.canvasView.getActiveObject()) {
      var object = fabric.util.object.clone(this.canvasView.getActiveObject());
      this.copiedObject = object;
      console.log('clone', object)
      this.copyCloneTempObjs = new Array();
    }
  }

  hiDraw.prototype.paste = function () {
    var that = this;
    if (this.copyCloneTempObjs.length > 0) {
      for (var i in this.copyCloneTempObjs) {
        this.copyCloneTempObjs[i] = fabric.util.object.clone(this.copyCloneTempObjs[i]);

        this.copyCloneTempObjs[i].set("top", this.copyCloneTempObjs[i].top + 100);
        this.copyCloneTempObjs[i].set("left", this.copyCloneTempObjs[i].left + 100);
        this.copyCloneTempObjs[i].hiId = hiDraw.prototype.uniqueIdGenerater()

        this.canvasView.add(this.copyCloneTempObjs[i]);
        this.canvasView.item(this.canvasView.size() - 1).hasControls = true;
      }
      this.canvasView.renderAll();
    } else if (this.copiedObject) {
      // this.copiedObject = fabric.util.object.clone(this.copiedObject);
      // if (this.copiedObject.get('type') == 'activeSelection') {
      //     console.log(this.copiedObject.get("top"), this.copiedObject.get("left"))
      //     this.copiedObject.set("top", this.copiedObject.get("top") + 10);
      //     this.copiedObject.set("left", this.copiedObject.get("left") + 10);
      //     this.canvasView.add(this.copiedObject);
      //     this.canvasView.item(this.canvasView.size() - 1).hasControls = true;
      // } else {
      //     this.copiedObject.set("top", this.copiedObject.get("top") + 10);
      //     this.copiedObject.set("left", this.copiedObject.get("left") + 10);
      //     this.canvasView.add(this.copiedObject);
      //     this.canvasView.item(this.canvasView.size() - 1).hasControls = true;
      // }
      // this.canvasView.renderAll();
      this.copiedObject.clone(function (clonedObj) {
        that.canvasView.discardActiveObject();
        clonedObj.set({
          left: clonedObj.left + 10,
          top: clonedObj.top + 10,
          evented: true,
        });
        if (clonedObj.type === 'activeSelection') {
          // active selection needs a reference to the canvas.
          clonedObj.canvas = that.canvasView;
          clonedObj.forEachObject(function (obj) {
            obj.hiId = hiDraw.prototype.uniqueIdGenerater()
            that.canvasView.add(obj);
          });
          // this should solve the unselectability
          clonedObj.setCoords();
        } else {
          that.canvasView.add(clonedObj);
        }
        if (Array.isArray(that.defaultOptions.copyPropertiesToInclude)) {
          for (var i = 0; i < that.defaultOptions.copyPropertiesToInclude.length; i++) {
            var key = that.defaultOptions.copyPropertiesToInclude[i];
            clonedObj[key] = that.copiedObject[key];
          }
        }
        clonedObj.hiId = hiDraw.prototype.uniqueIdGenerater()
        that.copiedObject.top += 10;
        that.copiedObject.left += 10;
        that.canvasView.setActiveObject(clonedObj);
        that.canvasView.requestRenderAll();
        // that.canvasView.discardActiveObject();
      });
    }

  }

  hiDraw.prototype.delete = function () {
    var that = this;
    var activeObject = this.canvasView.getActiveObject();
    if (activeObject && activeObject.type === 'activeSelection') {
      this.canvasView.discardActiveObject();
      activeObject.forEachObject(function (obj) {
        that.canvasView.remove(obj);
      });
    } else if (activeObject) {
      this.canvasView.discardActiveObject();
      this.canvasView.remove(activeObject);
      // this.canvasView.remove(Line);
      // this.canvasView.remove(Circle);
      // this.canvasView.remove(Rectangle);
      // this.canvasView.remove(Arrow);
    } else {

    }
    // //-----------------------------
    // var that = this;
    // var activeObject = this.canvasView.getActiveObject(),
    //     activeGroup = this.canvasView.getActiveGroup();
    // if (activeObject) {
    //     // if (confirm('Are you sure?')) {
    //     // }
    //     this.canvasView.remove(activeObject);

    // } else if (activeGroup) {
    //     // if (confirm('Are you sure?')) {}
    //     var objectsInGroup = activeGroup.getObjects();
    //     this.canvasView.discardActiveGroup();
    //     objectsInGroup.forEach(function (object) {
    //         that.canvasView.remove(object);
    //     });

    // }
  }

  hiDraw.prototype.addGroupSelection = function () {
    if (!this.canvasView.getActiveObject()) {
      return;
    }
    if (this.canvasView.getActiveObject().type !== 'activeSelection') {
      return;
    }
    var newGroup = this.canvasView.getActiveObject().toHiGroup()
    newGroup.hiId = this.uniqueIdGenerater()
    newGroup.scaleZ = 1
    newGroup.altitude = 0
    this.canvasView.requestRenderAll();
  }

  hiDraw.prototype.unGroupSelection = function () {
    if (!this.canvasView.getActiveObject()) {
      return;
    }
    if (this.canvasView.getActiveObject().type !== 'group' &&
    this.canvasView.getActiveObject().type !== 'hiGroup') {
      return;
    }
    this.canvasView.getActiveObject().toActiveSelection();
    this.canvasView.requestRenderAll();
  }

  hiDraw.prototype.deselectPolygons = function (selectedObj) {
    var that = this;
    if (selectedObj && selectedObj.type === 'activeSelection') {
      this.canvasView.forEachObject(function (obj) {
        if (obj.get('type') == 'hiPolygon' || obj.get('type') == 'hiPolyline') {
          if (obj.tempPoints) {
            obj.tempPoints.forEach(function (circle, index) {
              that.canvasView.remove(circle);
            })
          }
          if (obj.tempLines) {
            obj.tempLines.forEach(function (line, index) {
              that.canvasView.remove(line);
            })
          }
          obj.controls = fabric.Object.prototype.controls;
          obj.selectable = obj.editShape ? true : obj.get('selectable');
          obj.hasBorders = true;
          obj.hasControls = true;
          obj.editShape = false;
        }
      })
    } else {
      if (selectedObj && selectedObj.tempLines) {
        // console.log('tempPoints')
      } else if (selectedObj && selectedObj.tempPoints) {
        // console.log('tempLines')
      } else {
        this.canvasView.forEachObject(function (obj) {
          // console.log(obj.get('type'))
          if (selectedObj) {
            selectedObj.bringToFront();
          }
          if (selectedObj == obj) {
            if (obj.tempPoints || obj.tempLines) {
              selectedObj.sendToBack();
              if (obj.tempPoints) {
                obj.tempPoints.forEach(function (circle, index) {
                  circle.bringToFront();
                })
              }
              if (obj.tempLines) {
                obj.tempLines.forEach(function (line, index) {
                  line.bringToFront();
                })
              }
            }
          } else if (obj.get('type') == 'hiPolygon' || obj.get('type') == 'hiPolyline') {
            if (obj.tempPoints) {
              obj.tempPoints.forEach(function (circle, index) {
                that.canvasView.remove(circle);
              })
            }
            if (obj.tempLines) {
              obj.tempLines.forEach(function (line, index) {
                that.canvasView.remove(line);
              })
            }
            obj.controls = fabric.Object.prototype.controls;
            obj.selectable = obj.editShape ? true : obj.get('selectable');
            obj.hasBorders = true;
            obj.hasControls = true;
            obj.editShape = false;
          }
        })
      }
    }
  }

  hiDraw.prototype.loadImage = function () {

    // this.defaultOptions.image.imagAry = baseStr64;
    // this.defaultOptions.image.realWidth = json["imageWidth"];
    // this.defaultOptions.image.realHeight = json["imageHeight"];
    // imgElem.setAttribute('src', "data:image/png;base64," + baseStr64);
  }


  hiDraw.prototype.uniqueIdGenerater = function (action) {
    if (hiMathUtil) {
      return hiMathUtil.generateUUID()
    } else {
      var u = '',
        m = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
        i = 0,
        rb = Math.random() * 0xffffffff | 0;
      while (i++ < 36) {
        var c = m[i - 1],
          r = rb & 0xf,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
        u += (c == '-' || c == '4') ? c : v.toString(16);
        rb = i % 8 == 0 ? Math.random() * 0xffffffff | 0 : rb >> 4
      }
      return u
    }
  }

  hiDraw.prototype.colorToRgbA = function (color, alpha) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) {
      c = color.substring(1).split('');
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      if (typeof (alpha) !== 'number' && !alpha) {
        alpha = 1;
      }
      return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    } else if (/^(rgb)\(/.test(color)) {
      c = color.replace(/rgb/i, "rgba");
      if (typeof (alpha) !== 'number' && !alpha) {
        alpha = 1;
      }
      c = c.replace(/\)/i, ',' + alpha + ')');
      return c;
    } else if (/^(rgba)\(/.test(color)) {
      var m = color.split("(")[1].split(")")[0].split(",");
      if (typeof (alpha) !== 'number' && !alpha) {
        m[3] = 1;
      } else {
        m[3] = alpha;
      }
      return 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',' + m[3] + ')';
    } else {
      if (typeof (alpha) !== 'number' && !alpha) {
        alpha = 1;
      }
      return 'rgba(0,0,0,' + alpha + ')'
    }
  }

  hiDraw.prototype.rgba2hex = function (orig) {
    var a, isPercent,
      rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
      alpha = (rgb && rgb[4] || "").trim(),
      hex = rgb ?
      (rgb[1] | 1 << 8).toString(16).slice(1) +
      (rgb[2] | 1 << 8).toString(16).slice(1) +
      (rgb[3] | 1 << 8).toString(16).slice(1) : orig;
    if (alpha !== "") {
      a = alpha;
    } else {
      a = 01;
    }

    a = Math.round(a * 100) / 100;
    var alpha = Math.round(a * 255);
    var hexAlpha = (alpha + 0x10000).toString(16).substr(-2).toUpperCase();
    hex = hex + hexAlpha;

    return (hex).substring(0, 7);
  }

  hiDraw.prototype.toFabricJson = function () {
    if (this.canvasView) {
      // console.log('--- json ---', this.canvasView.toJSON(['label', 'uniqueIndex', 'hiId', 'altitude', 'source', 'scaleZ', 'XscaleXZ', 'depth']))
      return this.canvasView.toJSON([
        'label', 'uniqueIndex', 'hiId', 'altitude',
        'source', 'scaleZ', 'depth', 'rotateX', 'rotateZ',
        'camera'
      ]);
    } else {
      return {}
    }

  }

  global.hiDraw = hiDraw

})(typeof exports !== 'undefined' ? exports : this);