(function (global) {

  // 'use strict';

  var fabric = global.fabric || (global.fabric = {});

  if (fabric.HiLine) {
    fabric.warn('fabric.HiLine is already defined');
    return;
  }

  fabric.HiLine = fabric.util.createClass(fabric.Line, {

    type: 'hiLine',

    initialize: function (element, options) {
      options || (options = {});
      this.callSuper('initialize', element, options);
    },

    toObject: function (propertiesToInclude) {
      return this.callSuper('toObject', ['radius', 'startAngle', 'endAngle'].concat(propertiesToInclude));
    },

    _render: function (ctx) {
      this.callSuper('_render', ctx);

      // do not render if width/height are zeros or object is not visible
      if (this.width === 0 || this.height === 0 || !this.visible) return;

    }
  });

  fabric.HiLine.fromObject = function (object, callback) {
    callback && callback(new fabric.HiLine([object.x1, object.y1, object.x2, object.y2], object));
  };

  fabric.HiLine.async = true;

  fabric.HiLine.prototype.controls = {
    firstControl: new fabric.Control({
      positionHandler: function (dim, finalMatrix, fabricObject) {
        var centerP = {
          x: (fabricObject.x1 + fabricObject.x2) / 2,
          y: (fabricObject.y1 + fabricObject.y2) / 2
        }
        var finalPoint = {}
        if (centerP.x != fabricObject.left || centerP.y != fabricObject.top) {
          var finalPoint = {
            x: fabricObject.left - centerP.x + fabricObject.x1,
            y: fabricObject.top - centerP.y + fabricObject.y1
          }
        } else {
          var finalPoint = {
            x: fabricObject.x1,
            y: fabricObject.y1
          }
        }
        return fabric.util.transformPoint(
          finalPoint,
          fabricObject.canvas.viewportTransform
        );
      },
      mouseDownHandler: function (eventData, target) {
        var fabricObject = target;
        var centerP = {
          x: (fabricObject.x1 + fabricObject.x2) / 2,
          y: (fabricObject.y1 + fabricObject.y2) / 2
        }
        if (centerP.x != fabricObject.left || centerP.y != fabricObject.top) {
          fabricObject.x1 = fabricObject.x1 - centerP.x + fabricObject.left
          fabricObject.y1 = fabricObject.y1 - centerP.y + fabricObject.top
          fabricObject.x2 = fabricObject.x2 - centerP.x + fabricObject.left
          fabricObject.y2 = fabricObject.y2 - centerP.y + fabricObject.top
        }
      },
      actionHandler: function (eventData, transform, x, y) {
        var polygon = transform.target;
        polygon.x1 = x;
        polygon.y1 = y;
        polygon.left = (polygon.x1 + polygon.x2) / 2;
        polygon.top = (polygon.y1 + polygon.y2) / 2;
        polygon.width = Math.abs(x - polygon.x2);
        polygon.height = Math.abs(y - polygon.y2);
        return true;
      },
      cursorStyle: 'pointer',
      // render: renderIcon,
      cornerSize: 5
    }),
    secondControl: new fabric.Control({
      positionHandler: function (dim, finalMatrix, fabricObject) {
        var centerP = {
          x: (fabricObject.x1 + fabricObject.x2) / 2,
          y: (fabricObject.y1 + fabricObject.y2) / 2
        }
        var finalPoint = {}
        if (centerP.x != fabricObject.left || centerP.y != fabricObject.top) {
          finalPoint = {
            x: fabricObject.left - centerP.x + fabricObject.x2,
            y: fabricObject.top - centerP.y + fabricObject.y2
          }
        } else {
          finalPoint = {
            x: fabricObject.x2,
            y: fabricObject.y2
          }
        }
        return fabric.util.transformPoint(
          finalPoint,
          fabricObject.canvas.viewportTransform
        );
      },
      mouseDownHandler: function (eventData, target) {
        var fabricObject = target;
        var centerP = {
          x: (fabricObject.x1 + fabricObject.x2) / 2,
          y: (fabricObject.y1 + fabricObject.y2) / 2
        }
        if (centerP.x != fabricObject.left || centerP.y != fabricObject.top) {
          fabricObject.x1 = fabricObject.x1 - centerP.x + fabricObject.left
          fabricObject.y1 = fabricObject.y1 - centerP.y + fabricObject.top
          fabricObject.x2 = fabricObject.x2 - centerP.x + fabricObject.left
          fabricObject.y2 = fabricObject.y2 - centerP.y + fabricObject.top
        }
      },
      mouseUpHandler: function (eventData, target) {

      },
      actionHandler: function (eventData, transform, x, y) {
        var polygon = transform.target;
        polygon.x2 = x;
        polygon.y2 = y;
        polygon.left = (polygon.x1 + polygon.x2) / 2;
        polygon.top = (polygon.y1 + polygon.y2) / 2;
        polygon.width = Math.abs(x - polygon.x1);
        polygon.height = Math.abs(y - polygon.y1);
        return true;
      },
      cursorStyle: 'pointer',
      // render: renderIcon,
      cornerSize: 5
    })
  };

  hiDraw.prototype.Line = (function () {
    function Line(canvasItem, options) {
      this.canvasItem = canvasItem;
      this.canvas = canvasItem.canvasView;
      this.options = options;
      this.className = 'Line';
      this.isDrawing = false;
      this.tempPointsArray = new Array();
      this.bindEvents();
    }

    Line.prototype.bindEvents = function () {
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

    Line.prototype.unbindEvents = function () {
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

    Line.prototype.onMouseUp = function (o) {
      var inst = this;
      // if (inst.isEnable()) {
      //     inst.disable();
      // }
    };

    Line.prototype.onMouseMove = function (o) {
      var inst = this;
      if (!inst.isEnable()) {
        return;
      }

      var pointer = inst.canvas.getPointer(o.e);
      var activeObj = inst.canvas.getActiveObject();

      inst.tempPointsArray[1].set('left', pointer.x)
      inst.tempPointsArray[1].set('top', pointer.y)

      inst.shape.x1 = inst.tempPointsArray[0].get('left');
      inst.shape.y1 = inst.tempPointsArray[0].get('top');
      inst.shape.x2 = inst.tempPointsArray[1].get('left');
      inst.shape.y2 = inst.tempPointsArray[1].get('top');
      inst.shape.left = (inst.shape.x1 + inst.shape.x2) / 2;
      inst.shape.top = (inst.shape.y1 + inst.shape.y2) / 2;
      inst.shape.width = Math.abs(inst.shape.x1 - inst.shape.x2);
      inst.shape.height = Math.abs(inst.shape.y1 - inst.shape.y2);

      // activeObj.set({
      //     x2: pointer.x,
      //     y2: pointer.y
      // });
      // activeObj.setCoords();


      inst.canvas.renderAll();
    };

    Line.prototype.onMouseDown = function (o) {
      var inst = this;

      var pointer = inst.canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;

      if (!inst.isDrawing) {
        inst.enable();

        // first point
        var firstPoint = new fabric.Circle({
          tempDrawShape: true,
          radius: 5,
          fill: '#ff0000',
          stroke: 'rgba(0,0,0,0)',
          strokeWidth: 1,
          // left: (pointer.x / inst.canvas.getZoom()),
          // top: (pointer.y / inst.canvas.getZoom()),
          left: pointer.x,
          top: pointer.y,
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
          radius: 5,
          fill: '#ff0000',
          stroke: 'rgba(0,0,0,0)',
          strokeWidth: 1,
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

        var points = [
          inst.tempPointsArray[0].get('left'),
          inst.tempPointsArray[0].get('top'),
          inst.tempPointsArray[1].get('left'),
          inst.tempPointsArray[1].get('top')
        ];
        var line = new fabric.HiLine(points, {
          tempDrawShape: true,
          stroke: '#333333',
          strokeWidth: 2,
          fill: 'rgba(204,204,204,0.3)',
          opacity: 1,
          originX: 'center',
          originY: 'center',
          selectable: false,
          strokeUniform: true,
          objectCaching: false
        });
        inst.shape = line;
        inst.canvas.add(line);
        line.canvasItem = inst.canvasItem;
      } else {
        inst.disable();
        inst.generateLine();
      }


    };

    Line.prototype.isEnable = function () {
      return this.isDrawing;
    }

    Line.prototype.enable = function () {
      this.isDrawing = true;
    }

    Line.prototype.disable = function () {
      this.isDrawing = false;
      this.unbindEvents();
      if (this.options && this.options.endDraw) {
        this.options.endDraw();
      }
    }

    Line.prototype.generateLine = function (pointArray) {
      var inst = this;

      inst.canvas.remove(inst.shape);

      var points = [
        inst.tempPointsArray[0].get('left'),
        inst.tempPointsArray[0].get('top'),
        inst.tempPointsArray[1].get('left'),
        inst.tempPointsArray[1].get('top')
      ];
      var line = new fabric.HiLine(points, {
        // stroke: '#333333',
        // strokeWidth: 1,
        fill: 'rgba(204,204,204,0.3)',
        opacity: 1,
        originX: 'center',
        originY: 'center',
        hasBorders: true,
        hasControls: true,
        strokeUniform: true,
        objectCaching: false
      });
      line.on('selected', function (opt) {
        var evt = opt.e;
        var line = inst.canvas.getActiveObject();
        // if (evt && evt.ctrlKey === true) {
        line.cornerStyle = 'circle';
        line.cornerColor = 'rgba(0,0,255,0.5)';
      });
      inst.canvas.add(line).setActiveObject(line);
      line.canvasItem = inst.canvasItem;

      inst.tempPointsArray.forEach(function (point) {
        inst.canvas.remove(point);
      })

      inst.canvas.renderAll();
    }

    return Line;
  }());

  /*
  this.activeCanvas.view.drawLine(this.activeCanvas.view, {}, [
          [
            137.84615384615384,
            0
          ],
          [
            137.84615384615384,
            512
          ]
        ])
  */
  hiDraw.prototype.drawLine = (function () {
    // points = [[startX, startY], [endX, endY]]
    function Line(canvasItem, options, points) {
      this.canvasItem = canvasItem;
      this.canvas = canvasItem.canvasView;
      this.options = options;
      this.className = 'Line';
      this.isDrawing = false;
      this.tempPointsArray = new Array();
      var inst = this

      var points = [
        points[0][0],
        points[0][1],
        points[1][0],
        points[1][1]
      ];

      var colorStroke = 'rgba(255,0,0,1)'
      var colorFill = 'rgba(255,0,0,1)'
      if (this.options.stroke) {
        colorStroke = this.options.stroke
      }
      if (this.options.fill) {
        colorFill = this.options.fill
      }
      var zoom = inst.canvas.getZoom() || 1;
      var line = new fabric.HiLine(points, {
        referenceLine: true,
        stroke: colorStroke,
        strokeWidth: 1 / zoom,
        fill: colorFill,
        opacity: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
        hasBorders: false,
        hasControls: false,
        strokeUniform: true,
        objectCaching: false,
        perPixelTargetFind: true
      });
      // inst.canvas.add(line).setActiveObject(line);
      inst.canvas.add(line)
      line.canvasItem = inst.canvasItem;

      inst.tempPointsArray.forEach(function (point) {
        inst.canvas.remove(point);
      })

      inst.canvas.renderAll();
    }
    return Line;
  }());


})(typeof exports !== 'undefined' ? exports : this);