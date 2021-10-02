(function (global) {
  // 'use strict';

  var fabric = global.fabric || (global.fabric = {});

  if (fabric.HiCube) {
    fabric.warn('fabric.HiCube is already defined');
    return;
  }


  fabric.HiCube = fabric.util.createClass(fabric.Rect, {

    type: 'hiCube',

    initialize: function (element, options) {
      options || (options = {});
      this.callSuper('initialize', element, options);
    },

    toObject: function (propertiesToInclude) {
      return fabric.util.object.extend(this.callSuper('toObject', ['radius', 'startAngle', 'endAngle'].concat(propertiesToInclude)), {
        hiId: this.hiId,
        altitude: this.altitude,
        source: this.source,
        scaleZ: this.scaleZ
      });
    },

    _render: function (ctx) {
      this.callSuper('_render', ctx);

      // do not render if width/height are zeros or object is not visible
      if (this.width === 0 || this.height === 0 || !this.visible) return;

    }
  });

  fabric.HiCube.fromObject = function (object, callback) {
    callback && callback(new fabric.HiCube(object));
  };

  fabric.HiCube.async = true;

  // fabric.HiCube.prototype.controls = {
  //   lt: new fabric.Control({
  //     positionHandler: function (dim, finalMatrix, fabricObject) {
  //       var finalPoint = {
  //         x: fabricObject.left - fabricObject.width / 2,
  //         y: fabricObject.top - fabricObject.height / 2
  //       }
  //       return fabric.util.transformPoint(
  //         finalPoint,
  //         fabricObject.canvas.viewportTransform
  //       );
  //     },
  //     mouseDownHandler: function (eventData, target) {
  //       var fabricObject = target;
  //       fabricObject.rb = {
  //         x: fabricObject.left + fabricObject.width / 2,
  //         y: fabricObject.top + fabricObject.height / 2
  //       }
  //     },
  //     actionHandler: function (eventData, transform, x, y) {
  //       var polygon = transform.target;
  //       polygon.left = (x + polygon.rb.x) / 2;
  //       polygon.top = (y + polygon.rb.y) / 2;
  //       polygon.width = Math.abs(x - polygon.rb.x);
  //       polygon.height = Math.abs(y - polygon.rb.y);
  //       return true;
  //     },
  //     cursorStyle: 'pointer',
  //     // render: renderIcon,
  //     cornerSize: 5
  //   }),
  //   lb: new fabric.Control({
  //     positionHandler: function (dim, finalMatrix, fabricObject) {
  //       var finalPoint = {
  //         x: fabricObject.left - fabricObject.width / 2,
  //         y: fabricObject.top + fabricObject.height / 2
  //       }
  //       return fabric.util.transformPoint(
  //         finalPoint,
  //         fabricObject.canvas.viewportTransform
  //       );
  //     },
  //     mouseDownHandler: function (eventData, target) {
  //       var fabricObject = target;
  //       fabricObject.rt = {
  //         x: fabricObject.left + fabricObject.width / 2,
  //         y: fabricObject.top - fabricObject.height / 2
  //       }
  //     },
  //     actionHandler: function (eventData, transform, x, y) {
  //       var polygon = transform.target;
  //       polygon.left = (x + polygon.rt.x) / 2;
  //       polygon.top = (y + polygon.rt.y) / 2;
  //       polygon.width = Math.abs(x - polygon.rt.x);
  //       polygon.height = Math.abs(y - polygon.rt.y);
  //       return true;
  //     },
  //     cursorStyle: 'pointer',
  //     // render: renderIcon,
  //     cornerSize: 5
  //   }),
  //   rt: new fabric.Control({
  //     positionHandler: function (dim, finalMatrix, fabricObject) {
  //       var finalPoint = {
  //         x: fabricObject.left + fabricObject.width / 2,
  //         y: fabricObject.top - fabricObject.height / 2
  //       }
  //       return fabric.util.transformPoint(
  //         finalPoint,
  //         fabricObject.canvas.viewportTransform
  //       );
  //     },
  //     mouseDownHandler: function (eventData, target) {
  //       var fabricObject = target;
  //       fabricObject.lb = {
  //         x: fabricObject.left - fabricObject.width / 2,
  //         y: fabricObject.top + fabricObject.height / 2
  //       }
  //     },
  //     mouseUpHandler: function (eventData, target) {

  //     },
  //     actionHandler: function (eventData, transform, x, y) {
  //       var polygon = transform.target;
  //       polygon.left = (x + polygon.lb.x) / 2;
  //       polygon.top = (y + polygon.lb.y) / 2;
  //       polygon.width = Math.abs(x - polygon.lb.x);
  //       polygon.height = Math.abs(y - polygon.lb.y);
  //       return true;
  //     },
  //     cursorStyle: 'pointer',
  //     // render: renderIcon,
  //     cornerSize: 5
  //   }),
  //   rb: new fabric.Control({
  //     positionHandler: function (dim, finalMatrix, fabricObject) {
  //       var finalPoint = {
  //         x: fabricObject.left + fabricObject.width / 2,
  //         y: fabricObject.top + fabricObject.height / 2
  //       }
  //       return fabric.util.transformPoint(
  //         finalPoint,
  //         fabricObject.canvas.viewportTransform
  //       );
  //     },
  //     mouseDownHandler: function (eventData, target) {
  //       var fabricObject = target;
  //       fabricObject.lt = {
  //         x: fabricObject.left - fabricObject.width / 2,
  //         y: fabricObject.top - fabricObject.height / 2
  //       }

  //     },
  //     mouseUpHandler: function (eventData, target) {

  //     },
  //     actionHandler: function (eventData, transform, x, y) {
  //       var polygon = transform.target;
  //       polygon.left = (x + polygon.lt.x) / 2;
  //       polygon.top = (y + polygon.lt.y) / 2;
  //       polygon.width = Math.abs(x - polygon.lt.x);
  //       polygon.height = Math.abs(y - polygon.lt.y);
  //       return true;
  //     },
  //     cursorStyle: 'pointer',
  //     // render: renderIcon,
  //     cornerSize: 5
  //   })
  // }
  // urgent
  fabric.HiCube.prototype.controls = fabric.Object.prototype.controls;


  hiDraw.prototype.HiCube = (function () {
    function Rectangle(canvasItem, options, otherProps) {
      this.canvasItem = canvasItem;
      this.canvas = canvasItem.canvasView;
      this.options = options;
      this.otherProps = otherProps;
      this.className = 'Rectangle';
      this.isDrawing = false;
      this.tempPointsArray = new Array();
      this.bindEvents();
    }

    Rectangle.prototype.bindEvents = function () {
      var inst = this;
      inst.canvas.on('mouse:down', function (o) {
        inst.onMouseDown(o);
      });
      inst.canvas.on('mouse:move', function (o) {
        inst.onMouseMove(o);
      });
      inst.canvas.on('mouse:up', function (o) {
        inst.onMouseUp(o);
      });
      inst.canvas.on('object:moving', function (o) {
        inst.disable();
      })
    }

    Rectangle.prototype.unbindEvents = function () {
      var inst = this;
      inst.canvas.off('mouse:down');
      inst.canvas.off('mouse:move');
      inst.canvas.off('mouse:up');
      inst.canvas.off('object:added');
      inst.canvas.off('object:modified');
      inst.canvas.off('object:removed');
      inst.canvas.off('object:moving');
      inst.canvas.off('after:render');
      inst.canvas.off('mouse:wheel');
      inst.canvas.off('selection:created');
      inst.canvas.off('selection:updated');
      inst.canvas.off('selection:cleared');
    }

    Rectangle.prototype.onMouseUp = function (o) {
      var inst = this;
      // inst.disable();
    };

    Rectangle.prototype.onMouseMove = function (o) {
      var inst = this;
      if (inst.tempPointsArray.length == 0) {
        return;
      }

      var pointer = inst.canvas.getPointer(o.e);
      var activeObj = inst.canvas.getActiveObject();

      inst.tempPointsArray[1].set('left', pointer.x)
      inst.tempPointsArray[1].set('top', pointer.y)

      var minX, minY, maxX, maxY, midX, midY;
      minX = Math.min(inst.tempPointsArray[0].get('left'), inst.tempPointsArray[1].get('left'))
      maxX = Math.max(inst.tempPointsArray[0].get('left'), inst.tempPointsArray[1].get('left'))
      minY = Math.min(inst.tempPointsArray[0].get('top'), inst.tempPointsArray[1].get('top'))
      maxY = Math.max(inst.tempPointsArray[0].get('top'), inst.tempPointsArray[1].get('top'))
      midX = (inst.tempPointsArray[0].get('left') + inst.tempPointsArray[1].get('left')) / 2
      midY = (inst.tempPointsArray[0].get('top') + inst.tempPointsArray[1].get('top')) / 2

      inst.shape.set('left', midX)
      inst.shape.set('top', midY)
      inst.shape.set('width', maxX - minX)
      inst.shape.set('height', maxY - minY)

      inst.canvas.renderAll();

    };

    Rectangle.prototype.onMouseDown = function (o) {
      var inst = this;

      var pointer = inst.canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;

      if (!inst.isDrawing) {
        inst.enable();
        var zoom = inst.canvas.getZoom() || 1;
        // first point
        var firstPoint = new fabric.Circle({
          tempDrawShape: true,
          radius: 5 / zoom,
          fill: '#ff0000',
          stroke: 'rgba(0,0,0,0)',
          strokeWidth: 1 / zoom,
          left: pointer.x,
          top: pointer.y,
          // left: (pointer.x / inst.canvas.getZoom()),
          // top: (pointer.y / inst.canvas.getZoom()),
          selectable: false,
          hasBorders: false,
          hasControls: false,
          originX: 'center',
          originY: 'center',
          id: 'first_circle',
          strokeUniform: true,
          objectCaching: false
        });
        inst.tempPointsArray.push(firstPoint);
        inst.canvas.add(firstPoint)

        var secondPoint = new fabric.Circle({
          tempDrawShape: true,
          radius: 5 / zoom,
          fill: '#ff0000',
          stroke: 'rgba(0,0,0,0)',
          strokeWidth: 1 / zoom,
          left: pointer.x,
          top: pointer.y,
          // left: (pointer.x / inst.canvas.getZoom()),
          // top: (pointer.y / inst.canvas.getZoom()),
          selectable: false,
          hasBorders: false,
          hasControls: false,
          originX: 'center',
          originY: 'center',
          id: 'border_circle',
          strokeUniform: true,
          objectCaching: false
        });
        inst.tempPointsArray.push(secondPoint);
        inst.canvas.add(secondPoint)

        var minX, minY, maxX, maxY, midX, midY;
        minX = Math.min(inst.tempPointsArray[0].get('left'), inst.tempPointsArray[1].get('left'))
        maxX = Math.max(inst.tempPointsArray[0].get('left'), inst.tempPointsArray[1].get('left'))
        minY = Math.min(inst.tempPointsArray[0].get('top'), inst.tempPointsArray[1].get('top'))
        maxY = Math.max(inst.tempPointsArray[0].get('top'), inst.tempPointsArray[1].get('top'))
        midX = (inst.tempPointsArray[0].get('left') + inst.tempPointsArray[1].get('left')) / 2
        midY = (inst.tempPointsArray[0].get('top') + inst.tempPointsArray[1].get('top')) / 2

        var rect = new fabric.Rect({
          tempDrawShape: true,
          left: midX,
          top: midY,
          originX: 'center',
          originY: 'center',
          width: Math.abs(maxX - minX),
          height: Math.abs(maxY - minY),
          stroke: '#333333',
          strokeWidth: 2 / zoom,
          fill: 'rgba(204,204,204,0.3)',
          opacity: 1,
          selectable: false,
          hasBorders: true,
          hasControls: true,
          strokeUniform: true,
          objectCaching: false
        });

        inst.shape = rect;
        inst.canvas.add(rect);
      } else {
        inst.disable();
        inst.generateRectangle();
      }

    };

    Rectangle.prototype.isEnable = function () {
      return this.isDrawing;
    }

    Rectangle.prototype.enable = function () {
      this.isDrawing = true;
    }

    Rectangle.prototype.disable = function () {
      this.isDrawing = false;
      this.unbindEvents();
      if (this.options && this.options.endDraw) {
        this.options.endDraw();
      }
    }

    Rectangle.prototype.generateRectangle = function (pointArray) {
      var inst = this;

      inst.canvas.remove(inst.shape);

      var minX, minY, maxX, maxY, midX, midY;
      minX = Math.min(inst.tempPointsArray[0].get('left'), inst.tempPointsArray[1].get('left'))
      maxX = Math.max(inst.tempPointsArray[0].get('left'), inst.tempPointsArray[1].get('left'))
      minY = Math.min(inst.tempPointsArray[0].get('top'), inst.tempPointsArray[1].get('top'))
      maxY = Math.max(inst.tempPointsArray[0].get('top'), inst.tempPointsArray[1].get('top'))
      midX = (inst.tempPointsArray[0].get('left') + inst.tempPointsArray[1].get('left')) / 2
      midY = (inst.tempPointsArray[0].get('top') + inst.tempPointsArray[1].get('top')) / 2

      var rect = new fabric.HiCube({
        left: midX,
        top: midY,
        originX: 'center',
        originY: 'center',
        width: Math.abs(maxX - minX),
        height: Math.abs(maxY - minY),
        // stroke: '#7B7B7B',
        // fill: '#7B7B7B',
        // strokeWidth: 1,
        // fill: 'rgba(0,0,0,0)',
        opacity: 1,
        selectable: true,
        hasBorders: true,
        hasControls: true,
        strokeUniform: true,
        objectCaching: false
      });
      rect.on('selected', function (opt) {
        var evt = opt.e;
        var rect = inst.canvas.getActiveObject();
        // if (evt && evt.ctrlKey === true) {
        //     rect.cornerStyle = 'circle';
        //     rect.cornerColor = 'rgba(0,0,255,0.5)';
        //     rect.controls = inst.customControl()
        // } else {
        //     rect.cornerColor = 'rgb(178,204,255)';
        //     rect.cornerStyle = 'rect';
        //     rect.controls = fabric.Object.prototype.controls;
        // }
      });
      for (var prop in inst.otherProps) {
        rect[prop] = inst.otherProps[prop];
      }
      rect.hiId = hiDraw.prototype.uniqueIdGenerater()
      rect.altitude = 0
      rect.depth = 1
      rect.scaleZ = 1
      rect.rotateX = 0
      rect.rotateZ = 0
      inst.canvas.add(rect).setActiveObject(rect);
      rect.canvasItem = inst.canvasItem;

      inst.tempPointsArray.forEach(function (point) {
        inst.canvas.remove(point);
      })

      inst.canvas.renderAll();
    }

    return Rectangle;
  }());

})(typeof exports !== 'undefined' ? exports : this);