(function () {
  window.tt = 0
  window.imagePath = './spliteImg/1622/CMU-1'
  // window.imagePath = './spliteImg/1112222/1112222'
  window.imgInfo
  window.imglevel
  window.baselevel
  window.widthPointImportScale = 1
  window.heightPointImportScale = 1
  window.sliceSize = 3000

  window.beforeRotate = [];
  window.theta = 0;
  window.originalCenter = {};
  window.viewWidth = 500
  window.tempCanvasWidth = window.viewWidth * 2.0
  window.imageFilter = false
  // window.duotoneFilter // 紀錄 filter 屬性內容

  window.baselevelSelect = true

  window.edit = initCanvas('canvasParent', 'mainEditor')
  window.canvas = edit.canvasView
  loadInfo()
  miniMapActive()

  var slider = document.getElementById("myRange");
  var myAngle = document.getElementById("angle");
  var selectViewBtn = document.getElementById("selectViewBtn");
  // var output = document.getElementById("rotateNum");
  slider.oninput = function () {
    var objShow = false
    // if (parseInt(this.value) === 0 || parseInt(this.value) === 360) {
    //   objShow = true
    // }
    // edit.canvasView.forEachObject(function(i){
    //   i.visible = objShow
    // })
    rotateSwitch(parseInt(this.value))

    canvas.discardActiveObject();
    var selection = [];
    canvas.getObjects().forEach(function(o) {
      selection.push(o);
      o.selectable = false;
      o.hasBorders = false;
    });
    var sel = new fabric.ActiveSelection(selection, { canvas: canvas });
    // canvas.setActiveObject(sel).requestRenderAll();
    canvas.setActiveObject(sel)
    canvas.getActiveObject().toGroup()
    canvas.requestRenderAll();
    // canvas.discardActiveObject();

    // canvas.getObjects().forEach(function(o) {
    //   // var activeO = canvas.getActiveObject();
    //   var activeO = o;
    //   var scale = fabric.util.findScaleToFit(activeO, canvas);
    //   activeO.scaleX = scale;
    //   activeO.scaleY = scale;
    //   activeO.left = (canvas.width - activeO.getScaledWidth()) / 2
    //   activeO.top = (canvas.height - activeO.getScaledHeight()) / 2
    // });
    // canvas.requestRenderAll();

    document.getElementById('angle').value = this.value
    document.getElementById('zoomNum').innerHTML = realZoom()
  }
  myAngle.oninput = function () {
    document.getElementById('myRange').value = this.value
  }
  selectViewBtn.onclick = function () {
    selectView()
  }
  $('#panCanvas').click(function () {
    const panCanvas = !edit.defaultOptions.panCanvas
    edit.changeSelectableStatus(!panCanvas)
    edit.changeStatus({
      panCanvas: panCanvas
    })
  })

  $("#resizeCanvas").click(function () {
    // 圖移置中
    // const imgAryBaseWidth = window.baselevel.slice_size[0]
    // var pointer = edit.canvasView.getPointer(opt.e)
    rotateSwitch(0)
    newZoomToPoint({
      x: 0,
      y: 0
    }, 1)
    const imgAryBaseWidth = window.baselevel.resolution[0] // tempXXXX
    const rate = Math.ceil(imgAryBaseWidth / edit.canvasView.width)
    const x = (imgAryBaseWidth / rate - edit.canvasView.width) / 2
    edit.canvasView.absolutePan({
      x: x,
      y: 0
    })
    // 下載圖片
    var zoom = realZoom();
    var area = {
      x: shiftDrawArea(),
      y: shiftDrawArea(),
      w: window.tempCanvasWidth,
      h: window.tempCanvasWidth
    }
    var coordinate = leftTopCoord()
    if (window.theta !== 0) {
      var tempAngle = window.theta
      rotateSwitch(0)
      coordinate = leftTopCoord()
      rotateSwitch(tempAngle)
    }
    loadImgByLevelAndCanvasArea(window.baselevel, coordinate, zoom, area)
  });


  $('#btnExport').click(function () {
    // var fabricJson = edit.canvasView.toJSON(['label', 'uniqueIndex', 'hiId', 'altitude', 'source']);
    var fabricJson = edit.toFabricJson()
    fabricJson["objects"] = fabricJson["objects"].filter(function (obj) {
      if (!obj['tempDrawShape']) {
        return true;
      } else {
        return false;
      }
    })
    // $('#currentJson').val(JSON.stringify(fabricJson))
    var json = edit.export(fabricJson);
    $('#exportJson').val(JSON.stringify(json, null, 2))
  });

  $('#btnExportFabric').click(function () {
    // var fabricJson = edit.canvasView.toJSON(['label', 'uniqueIndex', 'hiId', 'altitude', 'source']);
    var fabricJson = edit.toFabricJson()
    fabricJson["objects"] = fabricJson["objects"].filter(function (obj) {
      if (!obj['tempDrawShape']) {
        return true;
      } else {
        return false;
      }
    })
    $('#currentJson').val(JSON.stringify(fabricJson, null, 2))
  });

  $('#btnLoadImage').click(function () {
    edit.canvasView.loadFromJSON({})
    edit.canvasView.setBackgroundImage('')
    rotateSwitch(0)
    newZoomToPoint({
      x: 0,
      y: 0
    }, 1)
    window.imagePath = $('#imagePath').val()
    loadInfo()
  })

  $('#btnImport').click(function () {
    // fetch('http://127.0.0.1:2002/spliteImg/1112222/1112222.json')
    fetch('http://127.0.0.1:2002/spliteImg/1112222/1112222_reduced.json')
      .then(function(response) {
        console.log(response)
        return response.json();
      })
      .then(function(myJson) {
        console.log(myJson);
        // var labelmeJson = JSON.parse($('#exportJson').val())
        var labelmeJson = myJson
        if (typeof myJson === 'string') {
          labelmeJson = JSON.parse(myJson)
        } 
        // reset json point scale -----------------
        if (labelmeJson.imageWidth && labelmeJson.imageHeight) {
          const imgAryBaseWidth = window.baselevel.resolution[0] // tempXXXX
          const rate = Math.ceil(imgAryBaseWidth / canvas.width)
          window.widthPointImportScale = window.baselevel.resolution[0] / Number(labelmeJson.imageWidth) / rate
          window.heightPointImportScale = window.baselevel.resolution[1] / Number(labelmeJson.imageHeight) / rate
          for(let i = 0; i < labelmeJson.shapes.length; i++) {
            if (labelmeJson.shapes[i].shape_type === 'circle') {
              for(let j = 0; j < labelmeJson.shapes[i].points.length; j++) {
                labelmeJson.shapes[i].points[j][0] *= window.widthPointImportScale
                labelmeJson.shapes[i].points[j][1] *= window.heightPointImportScale
              }
            }
            if (labelmeJson.shapes[i].shape_type === 'polygon') {
              for(let j = 0; j < labelmeJson.shapes[i].points.length; j++) {
                labelmeJson.shapes[i].points[j][0] *= window.widthPointImportScale
                labelmeJson.shapes[i].points[j][1] *= window.heightPointImportScale
              }
            }
            if (labelmeJson.shapes[i].shape_type === 'rectangle') {
              for(let j = 0; j < labelmeJson.shapes[i].points.length; j++) {
                labelmeJson.shapes[i].points[j][0] *= window.widthPointImportScale
                labelmeJson.shapes[i].points[j][1] *= window.heightPointImportScale
              }
            }
          }
          labelmeJson.imageWidth = window.baselevel.resolution[0]
          labelmeJson.imageHeight = window.baselevel.resolution[1]
        }
        // -----------------
        var fabricJson = edit.import(labelmeJson)
        console.log('---fabricJson---', fabricJson)
        var fabricJsonOrg = edit.toFabricJson()
        fabricJsonOrg["objects"] = fabricJsonOrg["objects"].filter(function (obj) {
          if (!obj['tempDrawShape']) {
            return true;
          } else {
            return false;
          }
        })
        fabricJson.backgroundImage = fabricJsonOrg.backgroundImage
        edit.canvasView.loadFromJSON(fabricJson, function(){
          edit.canvasView.renderAll.bind(edit.canvasView)
          clearTimeout(window.clearMiniMapTimeout)
          window.clearMiniMapTimeout = setTimeout(function(){
            drawMiniMap();
          },10)
        }, function(){
          console.log('***')
        })
      });
    
  })

  $('#btnImportFabric').click(function () {
    // var fabricJson = edit.canvasView.toJSON(['label', 'uniqueIndex', 'hiId', 'altitude', 'source']);
    var fabricJsonOrg = edit.toFabricJson()
    fabricJsonOrg["objects"] = fabricJsonOrg["objects"].filter(function (obj) {
      if (!obj['tempDrawShape']) {
        return true;
      } else {
        return false;
      }
    })
    var fabricJson = JSON.parse($('#currentJson').val())
    fabricJson.backgroundImage = fabricJsonOrg.backgroundImage
    edit.canvasView.loadFromJSON(fabricJson, edit.canvasView.renderAll.bind(edit.canvasView), function(){
      console.log('????????')
    })
    // $('#currentJson').val(JSON.stringify(fabricJson))
    // var json = edit.export(fabricJson);
    // $('#exportJson').val(JSON.stringify(json, null, 2))
  });


  window.addEventListener('resize', function () {
    var elem = document.getElementById('canvasParent');
    setTimeout(function () {
      edit.canvasView.setWidth(parseInt(elem.offsetWidth))
      edit.canvasView.setHeight(parseInt(elem.offsetHeight))
      edit.canvasView.renderAll()
    }, 300)
  });


  function initCanvas(canvasId, canvasViewId) {
    var elem = document.getElementById(canvasId);
    window.viewWidth = elem.clientWidth
    window.tempCanvasWidth = window.viewWidth * 2.0
    var edit = new hiDraw({
      canvasViewId: canvasViewId,
      // viewJsonTextId: 'hiJsonArea',
      // activeJsonTextId: 'hiActiveJsonArea',
      canvasWidth: elem.offsetWidth,
      canvasHeight: elem.offsetHeight,
      objectDefault: {
        fillAlpha: 0,
        lineWidth: 1,
        strokeColor: 'rgba(51, 51, 51, 1)',
        eventCtrl: {
          mouse_wheel_default_behavior: false,
          mouse_down_default_behavior: false,
          mouse_move_default_behavior: false,
          mouse_up_default_behavior: false,
          zoomMax: 128,
          zoomMin: 0.01
        }
      },
      event: {
        object_added: function (opt) {},
        object_modified: function (opt) {},
        object_removed: function (opt) {},
        after_render: function (opt) {},
        selection_created: function (opt) {},
        selection_updated: function (opt) {},
        selection_cleared: function (opt) {},
        import_callback: function () {},
        mouse_wheel: function (opt) {
          var delta = opt.e.deltaY;
          var zoom = realZoom()
          zoom *= 0.999 ** delta;
          if (zoom > 128) zoom = 128;
          if (zoom < 0.01) zoom = 0.01;
          var pointer = edit.canvasView.getPointer(opt.e)
          newZoomToPoint(pointer, zoom)
          document.getElementById('zoomNum').innerHTML = realZoom()
          opt.e.preventDefault();
          opt.e.stopPropagation();
          // return false
          clearTimeout(tt)
          // renderCanvas()
          tt = setTimeout(function () {
            var levelInfo = window.imgInfo.partition.find(function (item) {
              return item.scaleRate < zoom || item.scaleRate === 1
            })
            var area = {
              x: shiftDrawArea(),
              y: shiftDrawArea(),
              w: window.tempCanvasWidth,
              h: window.tempCanvasWidth
            }
            var coordinate = leftTopCoord()
            if (window.theta !== 0) {
              var tempAngle = window.theta
              rotateSwitch(0)
              coordinate = leftTopCoord()
              rotateSwitch(tempAngle)
            }
            loadImgByLevelAndCanvasArea(levelInfo, coordinate, zoom, area)
          }, 1000)
        },
        mouse_down: function (opt) {
          var evt = opt.e;
          var pointer = edit.canvasView.getPointer(evt);
          if (evt.altKey === true || edit.defaultOptions.panCanvas) {
            edit.isDragging = true;
            edit.selection = false;
            edit.lastPosX = evt.clientX;
            edit.lastPosY = evt.clientY;
            edit.lastPosX1 = pointer.x;
            edit.lastPosY1 = pointer.y;
          }
        },
        mouse_move: function (opt) {
          if (edit.isDragging) {
            var e = opt.e;
            var pointer = edit.canvasView.getPointer(e);
            var vpt = edit.canvasView.viewportTransform;
            vpt[4] += e.clientX - edit.lastPosX;
            vpt[5] += e.clientY - edit.lastPosY;
            edit.canvasView.setViewportTransform(vpt);
            // this.requestRenderAll();
            edit.lastPosX = e.clientX;
            edit.lastPosY = e.clientY;
            edit.lastPosX1 = pointer.x;
            edit.lastPosY1 = pointer.y;
            var zoom = realZoom()
            clearTimeout(tt)
            // renderCanvas()
            tt = setTimeout(function () {
              var levelInfo = window.imgInfo.partition.find(function (item) {
                return item.scaleRate < zoom || item.scaleRate === 1
              })
              var area = {
                x: shiftDrawArea(),
                y: shiftDrawArea(),
                w: window.tempCanvasWidth,
                h: window.tempCanvasWidth
              }
              var coordinate = leftTopCoord()
              if (window.theta !== 0) {
                var tempAngle = window.theta
                rotateSwitch(0)
                coordinate = leftTopCoord()
                rotateSwitch(tempAngle)
              }
              loadImgByLevelAndCanvasArea(levelInfo, coordinate, zoom, area)
            }, 1000)
            edit.canvasView.renderAll();
          }
        },
        mouse_up: function (opt) {
          edit.isDragging = false;
          edit.selection = true;
        }
      }
    }).createView().viewEvent();



    return edit;
  }

  function newZoomToPoint(pointer, value) {
    window.pointer = pointer
    // 補 1. 先以point，反轉theta轉正
    // var rtheta = -1 * parseInt(window.theta) * Math.PI / 180
    var rtheta = parseInt(360 - window.theta) * Math.PI / 180
    var ary = new Array(6)
    var rotateMatrix = [Math.cos(rtheta), Math.sin(rtheta), -1 * Math.sin(rtheta), Math.cos(rtheta), 0, 0]
    var rotateOrigianlCenter = pointRotate(rotateMatrix, pointer)
    var centerMoveMatirx = [1, 0, 0, 1, pointer.x - rotateOrigianlCenter.x, pointer.y - rotateOrigianlCenter.y]
    ary = canvas.viewportTransform
    ary = matrixProduct(ary, centerMoveMatirx) // 先平移
    ary = matrixProduct(ary, rotateMatrix) // 再旋轉
    canvas.setViewportTransform(ary);
    // ------------------------------------------------
    var zoomOrigianlCenter = pointer
    var zoomOrigianlRate = canvas.viewportTransform[0]
    // 1. 找出當前座標點，轉回螢幕點的座標
    var screenPoint = {
      x: zoomOrigianlCenter.x * zoomOrigianlRate + canvas.viewportTransform[4],
      y: zoomOrigianlCenter.y * zoomOrigianlRate + canvas.viewportTransform[5]
    }
    canvas.zoomToPoint(screenPoint, value);
    canvas.renderAll();
    // ------------------------------------------------
    // 補 2. 轉 theta
    var rtheta = parseInt(window.theta) * Math.PI / 180
    var ary = new Array(6)
    var rotateMatrix = [Math.cos(rtheta), Math.sin(rtheta), -1 * Math.sin(rtheta), Math.cos(rtheta), 0, 0]
    var rotateOrigianlCenter = pointRotate(rotateMatrix, pointer)
    var centerMoveMatirx = [1, 0, 0, 1, pointer.x - rotateOrigianlCenter.x, pointer.y - rotateOrigianlCenter.y]
    ary = canvas.viewportTransform
    ary = matrixProduct(ary, centerMoveMatirx) // 先平移
    ary = matrixProduct(ary, rotateMatrix) // 再旋轉
    canvas.setViewportTransform(ary);
    canvas.renderAll();

    document.getElementById('angle').value = window.theta
    document.getElementById('myRange').value = window.theta
    document.getElementById('zoomNum').innerHTML = realZoom()
  }


  function shiftDrawArea(w, h, tempCanvasWidth, tempCanvasHeight, rate) {
    w = window.viewWidth
    tempCanvasWidth = window.tempCanvasWidth
    if (!rate) {
      rate = 1.5;
    }
    if (!h) {
      h = w
    }
    if (!tempCanvasHeight) {
      tempCanvasHeight = tempCanvasWidth
    }
    return (tempCanvasWidth - w) / 2 * -1
  }

  function realZoom() {
    var zoom = 0
    if (window.theta !== 0) {
      var rtheta = -1 * parseInt(window.theta) * Math.PI / 180
      var rotateMatrix = [Math.cos(rtheta), Math.sin(rtheta), -1 * Math.sin(rtheta), Math.cos(rtheta), 0, 0]
      var ary = canvas.viewportTransform
      ary = matrixProduct(ary, rotateMatrix) // 再旋轉
      zoom = ary[0];
    } else {
      zoom = canvas.getZoom();
    }
    return zoom
  }

  function leftTopCoord() {
    return fabric.util.transformPoint({
      x: 0,
      y: 0
    }, fabric.util.invertTransform(canvas.viewportTransform))
  }


  function rotatePoint(rotateValue, pointer) {
    if (!pointer) {
      pointer = leftTopCoord()
    }
    // 先反轉到 0度
    // var rtheta = -1 * parseInt(window.theta) * Math.PI / 180
    var rtheta = parseInt(360 - window.theta) * Math.PI / 180
    var ary = new Array(6)
    var rotateMatrix = [Math.cos(rtheta), Math.sin(rtheta), -1 * Math.sin(rtheta), Math.cos(rtheta), 0, 0]
    var rotateOrigianlCenter = pointRotate(rotateMatrix, pointer)
    var centerMoveMatirx = [1, 0, 0, 1, pointer.x - rotateOrigianlCenter.x, pointer.y - rotateOrigianlCenter.y]
    ary = canvas.viewportTransform
    ary = matrixProduct(ary, centerMoveMatirx) // 先平移
    ary = matrixProduct(ary, rotateMatrix) // 再旋轉
    canvas.setViewportTransform(ary);
    canvas.renderAll();
    // 縮放
    var zoom = canvas.viewportTransform[0] // 轉正後可用來取代縮放倍率
    // 再正轉到 rotateValue 角度
    // setTimeout(function(){
    window.theta = rotateValue
    var rtheta = parseInt(window.theta) * Math.PI / 180
    var ary = new Array(6)
    var rotateMatrix = [Math.cos(rtheta), Math.sin(rtheta), -1 * Math.sin(rtheta), Math.cos(rtheta), 0, 0]
    var rotateOrigianlCenter = pointRotate(rotateMatrix, pointer)
    var centerMoveMatirx = [1, 0, 0, 1, pointer.x - rotateOrigianlCenter.x, pointer.y - rotateOrigianlCenter.y]
    ary = canvas.viewportTransform
    ary = matrixProduct(ary, centerMoveMatirx) // 先平移
    ary = matrixProduct(ary, rotateMatrix) // 再旋轉
    canvas.setViewportTransform(ary);
    canvas.renderAll();
    // },2000)
    clearTimeout(window.clearMiniMapTimeout)
    window.clearMiniMapTimeout = setTimeout(function(){
      drawMiniMap();
    },10)
  }

  function rotateSwitch(rotateValue) {
    document.getElementById('angle').value = rotateValue
    document.getElementById('myRange').value = rotateValue
    document.getElementById('zoomNum').innerHTML = realZoom()
    rotatePoint(rotateValue, CenterCoord())
  }

  function matrixProduct(A, B) {
    return fabric.util.multiplyTransformMatrices(A, B);
  }


  function loadImgByLevelAndCanvasArea(levelInfo, coord, zoom, canvasArea) {
    var count = levelInfo.count;
    var level = parseInt(levelInfo.level);
    var scaleRate = levelInfo.scaleRate;
    // if(level < 3) {return false}
    var row = parseInt(levelInfo.row);
    var column = parseInt(levelInfo.column);
    if (!window.imglevel[parseInt(levelInfo.level)]) {
      window.imglevel[parseInt(levelInfo.level)] = {}
    }
    if (!window.imglevel[parseInt(levelInfo.level)].imgAry) {
      window.imglevel[parseInt(levelInfo.level)].imgAry = new Array(count);
    }
    var imgAry = window.imglevel[parseInt(levelInfo.level)].imgAry;
    // var imgAryBaseWidth = window.imglevel[parseInt(window.baselevel.level)].imgAry[0].width
    const imgBaseInfo = window.imgInfo.partition.find(function (item) {
      return item.level === window.baselevel.level
    })
    // const imgAryBaseWidth = imgBaseInfo.slice_size[0]
    const imgAryBaseWidth = imgBaseInfo.resolution[0] // tempXXX
    // -----------------
    var canvasTemplate
    if (document.getElementById('level_' + level)) {
      canvasTemplate = document.getElementById('level_' + level)
    } else {
      canvasTemplate = document.createElement('canvas')
      canvasTemplate.id = 'level_' + level
      document.getElementById('tempDiv').appendChild(canvasTemplate)
    }
    canvasTemplate.level = level
    canvasTemplate.scaleRate = scaleRate
    canvasTemplate.width = window.tempCanvasWidth
    canvasTemplate.height = window.tempCanvasWidth
    var rate = Math.ceil(imgAryBaseWidth / window.viewWidth);
    // -------------------
    for (var i = 0; i < row; i++) {
      for (var j = 0; j < column; j++) {
        var idx = i * (column) + j;
        // var t = Math.floor(idx/(column)) * window.sliceSize
        var w = window.sliceSize / scaleRate / rate * zoom; // why 2 ?
        var h = window.sliceSize / scaleRate / rate * zoom; // why 2 ?
        var t = Math.floor(idx / column) * window.sliceSize
        var x = ((idx % (column)) * window.sliceSize) / scaleRate / rate * zoom - coord.x * zoom
        var y = t / scaleRate / rate * zoom - coord.y * zoom
        var areaB = {
          x: x,
          y: y,
          w: w,
          h: h
        }
        // var area = {
        //   x: (coord.x + shiftDrawArea()) * zoom,
        //   y: (coord.y + shiftDrawArea()) * zoom,
        //   w: window.tempCanvasWidth * zoom,
        //   h: window.tempCanvasWidth * zoom
        // }
        // canvasArea = area
        const lt = beforeRotateLeftTopCoord(window.theta, CenterCoord(), {
          x: 0,
          y: 0
        })
        const nl = canvas.width
        var canvasAreaA = JSON.parse(JSON.stringify(canvasArea))
        // canvasArea = {
        //   x: lt.x - 0.5 * nl,
        //   y: lt.y - 0.5 * nl,
        //   w: nl * 2 * zoom,
        //   h: nl * 2 * zoom
        // }
        canvasArea = {
          x: (coord.x - shiftByViewWidth(0, 0, 0, 0, 0, zoom) - coord.x) * zoom,
          y: (coord.y - shiftByViewWidth(0, 0, 0, 0, 0, zoom) - coord.y) * zoom,
          w: window.tempCanvasWidth / zoom * zoom,
          h: window.tempCanvasWidth / zoom * zoom
        }
        if (boundaryIntersect(areaB, canvasArea)) {
          if (imgAry[idx]) {
            // 已下載過
            // drawTempCanvasByLevel(levelInfo, coord, zoom, true)
          } else {
            // 需下載圖片
            var img = new Image();
            img.comp = false;
            img.onload = function () {
              this.comp = true;
              drawTempCanvasByLevel(levelInfo, coord, zoom, true)
            };
            img.n = level + '_' + i + '_' + j
            img.src = window.imagePath + "_" + level + '_' + i + '_' + j + ".jpg";
            imgAry[i * (column) + j] = img
          }
        } else {
        }
      }
    }
    drawTempCanvasByLevel(levelInfo, coord, zoom, true)
  }


  function drawTempCanvasByLevel(levelInfo, coord, zoom, changeView) {
    // var ss = 4 * 6
    var level = parseInt(levelInfo.level);
    var count = parseInt(levelInfo.count);
    var row = parseInt(levelInfo.row);
    var column = parseInt(levelInfo.column);
    var scaleRate = levelInfo.scaleRate;
    if (!zoom) {
      zoom = 1
    }
    if (!coord) {
      coord = {
        x: 0,
        y: 0
      }
    }
    var canvasTemplate
    if (document.getElementById('level_' + level)) {
      canvasTemplate = document.getElementById('level_' + level)
    } else {
      canvasTemplate = document.createElement('canvas')
      canvasTemplate.id = 'level_' + level
      document.getElementById('tempDiv').appendChild(canvasTemplate)
    }
    canvasTemplate.level = level
    canvasTemplate.scaleRate = scaleRate
    canvasTemplate.width = window.tempCanvasWidth
    canvasTemplate.height = window.tempCanvasWidth
    var imgAry = window.imglevel[parseInt(level)].imgAry
    // var imgAryBaseWidth = window.imglevel[parseInt(window.baselevel.level)].imgAry[0].width
    // var imgAryBaseWidth = window.baselevel.slice_size[0]
    var imgAryBaseWidth = window.baselevel.resolution[0] // tempXXX
    var ctx = canvasTemplate.getContext("2d");
    for (var i = 0; i < imgAry.length; i++) {
      var t = Math.floor(i / (column)) * window.sliceSize
      if (imgAry[i] && imgAry[i].comp) {
        // 繪製暫時畫布
        // ctx.drawImage(圖片, left, top, width, height)
        if (count === 1) {
          var w, h, x, y
          // why 2?
          var rate = Math.ceil(imgAryBaseWidth / window.viewWidth);
          w = imgAry[i].width / scaleRate / rate * zoom; // why 2 ?
          h = imgAry[i].height / scaleRate / rate * zoom; // why 2 ?
          // x = -1 * coord.x*zoom
          // y = -1 * coord.y*zoom
          x = (shiftByViewWidth(0, 0, 0, 0, 0, zoom) - 1 * coord.x) * zoom
          y = (shiftByViewWidth(0, 0, 0, 0, 0, zoom) - 1 * coord.y) * zoom
          ctx.drawImage(imgAry[i], x, y, w, h);
          ctx.font = "10px Arial";
          ctx.fillStyle = '#FFF';
          ctx.fillText(imgAry[i].n, 0, 10);
          ctx.strokeStyle = '#F00';
          ctx.beginPath()
          ctx.moveTo(x + 20, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + 20);
          ctx.stroke()
        } else {
          var rate = Math.ceil(imgAryBaseWidth / window.viewWidth);
          w = window.sliceSize / scaleRate / rate * zoom; // why 2 ?
          h = window.sliceSize / scaleRate / rate * zoom; // why 2 ?
          t = Math.floor(i / column) * window.sliceSize
          // x = ((i%(column)) * window.sliceSize) / scaleRate / rate * zoom + (shiftByViewWidth(0,0,0,0,0,zoom) - 1 * coord.x)*zoom
          // y = (t)*zoom / scaleRate /rate + (shiftByViewWidth(0,0,0,0,0,zoom) -1 * coord.y)*zoom
          x = (((i % column) * window.sliceSize) / scaleRate / rate - coord.x + shiftByViewWidth(0, 0, 0, 0, 0, zoom)) * zoom
          // x = (((i%column) * window.sliceSize) / scaleRate / rate - coord.x ) * zoom
          y = (t / scaleRate / rate - coord.y + shiftByViewWidth(0, 0, 0, 0, 0, zoom)) * zoom
          // y = (t / scaleRate / rate - coord.y) * zoom
          var areaA = {
            x: coord.x + shiftDrawArea() * zoom,
            y: coord.y + shiftDrawArea() * zoom,
            w: window.tempCanvasWidth * zoom,
            h: window.tempCanvasWidth * zoom
          }
          const lt = beforeRotateLeftTopCoord(window.theta, CenterCoord(), {
            x: 0,
            y: 0
          })
          const nl = canvas.width
          // var area = {
          //   x: lt.x - 0.5 * nl,
          //   y: lt.y - 0.5 * nl,
          //   w: nl * 2 * zoom,
          //   h: nl * 2 * zoom
          // }
          // var area = {
          //   x: coord.x - shiftByViewWidth(0,0,0,0,0,zoom),
          //   y: coord.y - shiftByViewWidth(0,0,0,0,0,zoom),
          //   w: window.tempCanvasWidth / zoom,
          //   h: window.tempCanvasWidth / zoom
          // }
          var area = {
            x: (coord.x - shiftByViewWidth(0, 0, 0, 0, 0, zoom) - coord.x + shiftByViewWidth(0, 0, 0, 0, 0, zoom)) * zoom,
            y: (coord.y - shiftByViewWidth(0, 0, 0, 0, 0, zoom) - coord.y + shiftByViewWidth(0, 0, 0, 0, 0, zoom)) * zoom,
            w: window.tempCanvasWidth / zoom * zoom,
            h: window.tempCanvasWidth / zoom * zoom
          }
          // window.area = area
          var areaB = {
            x: x,
            y: y,
            w: w,
            h: h
          }
          if (boundaryIntersect(areaB, area)) {
            ctx.drawImage(
              imgAry[i],
              x,
              y,
              w,
              h
            );
          } else {
          }
          ctx.font = "10px Arial";
          ctx.fillStyle = '#FFF';
          // ctx.fillText(imgAry[i].n, ((i%(row)) * window.sliceSize)*zoom/ss - coord.x*zoom, (t)*zoom/ss - coord.y*zoom + 10);
          ctx.fillText(imgAry[i].n,
            x,
            y + 10);
          ctx.strokeStyle = '#F00';
          ctx.beginPath()
          ctx.moveTo(x + 20, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + 20);
          ctx.stroke()
        }
        // if (level === parseInt(window.baselevel.level) || changeView) {
        //   renderCanvasByLevel(levelInfo, coord, zoom)
        // }
      }
    }
    if (level === parseInt(window.baselevel.level) || changeView) {
      renderCanvasByLevel(levelInfo, coord, zoom)
    }
  }


  function renderCanvasByLevel(levelInfo, coord, zoom) {
    var level = parseInt(levelInfo.level);
    var row = parseInt(levelInfo.row);
    var scaleRate = parseInt(levelInfo.scaleRate)
    if (!zoom) {
      zoom = scaleRate
    }
    if (!coord) {
      coord = {
        x: 0,
        y: 0
      }
    }
    var canvasTemplate = document.getElementById('level_' + level);
    if (canvasTemplate) {
      dataURL = canvasTemplate.toDataURL('image/jpeg');
      // 將圖繪製到 真實畫布
      if (window.imageFilter) {
        if (!window.duotoneFilter) {
          window.duotoneFilter = new fabric.Image.filters.Composed({
            subFilters: [
              new fabric.Image.filters.Grayscale({
                mode: 'luminosity'
              }), // make it black and white
              new fabric.Image.filters.BlendColor({
                color: '#00ff36'
              }), // apply light color
              new fabric.Image.filters.BlendColor({
                color: '#23278a',
                mode: 'lighten'
              }), // apply a darker color
            ]
          });
        }
        // 套用 fabric image filter
        fabric.Image.fromURL(dataURL, function (image) {
          // globalImage = image;
          image.filters = [window.duotoneFilter];
          // image.scaleToWidth(480);
          image.applyFilters();
          canvas.setBackgroundImage(image, function () {
            canvas.renderAll();
          }, {
            originX: 'left',
            originY: 'top',
            left: coord.x - shiftByViewWidth(0, 0, 0, 0, 0, zoom),
            top: coord.y - shiftByViewWidth(0, 0, 0, 0, 0, zoom),
            scaleX: 1 / zoom,
            scaleY: 1 / zoom
          });
          canvas.renderAll();
        }, {
          crossOrigin: 'anonymous'
        });
      } else {
        // 不套用 fabric image filter
        canvas.setBackgroundImage(dataURL, function () {
          // canvas.renderAll.bind(canvas)
          // canvas.backgroundImage.rotate(window.theta);
          canvas.renderAll();
        }, {
          originX: 'left',
          originY: 'top',
          // angle: 45, // theta window.theta
          left: coord.x - shiftByViewWidth(0, 0, 0, 0, 0, zoom),
          top: coord.y - shiftByViewWidth(0, 0, 0, 0, 0, zoom),
          scaleX: 1 / zoom,
          scaleY: 1 / zoom
        });
        canvas.renderAll();
      }
      clearTimeout(window.clearMiniMapTimeout)
      window.clearMiniMapTimeout = setTimeout(function(){
        drawMiniMap();
      },10)
    }
  }


  function boundaryIntersect(areaA, areaB) {
    // area: {x,y,w,h}
    // 確認 A x 兩端點 交集 B
    var ax1 = areaA.x,
      ax2 = areaA.x + areaA.w;
    var ay1 = areaA.y,
      ay2 = areaA.y + areaA.h;
    var bx1 = areaB.x,
      bx2 = areaB.x + areaB.w;
    var by1 = areaB.y,
      by2 = areaB.y + areaB.h;
    var xIntersect = false,
      yIntersect = false;

    if (ax1 >= bx1 && ax1 <= bx2) {
      xIntersect = true
    } else if (ax2 >= bx1 && ax2 <= bx2) {
      xIntersect = true
    } else if (ax2 >= bx1 && ax1 <= bx1) {
      xIntersect = true
    }
    if (ay1 >= by1 && ay1 <= by2) {
      yIntersect = true
    } else if (ay2 >= by1 && ay2 <= by2) {
      yIntersect = true
    } else if (ay2 >= by1 && ay1 <= by1) {
      yIntersect = true
    }
    return xIntersect & yIntersect
    // return true

  }


  function drawMiniMap() {
    const that = this
    // that.ndpi.baselevel

    const canvasMinimap = document.getElementById('minimapCanvas')
    const ctx = canvasMinimap.getContext('2d')
    canvasMinimap.width = 300
    canvasMinimap.height = 300
    const level = window.baselevel.level
    const scaleRate = 1
    const zoom = realZoom() ? realZoom() : 1
    var imgAryBaseWidth = window.baselevel.resolution[0] // tempXXX
    const rate = Math.ceil((imgAryBaseWidth / scaleRate) / canvas.width)
    const rateCanvas = Math.ceil(canvas.width / canvasMinimap.width)
    ctx.clearRect(0, 0, canvasMinimap.width, canvasMinimap.height)
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 1
    // 縮圖置中，添加平移量
    const baseX = (canvasMinimap.width - imgAryBaseWidth / rate / rateCanvas) / 2
    // ----------------------
    // var rtheta = parseInt(window.theta) * Math.PI / 180
    // ctx.rotate(rtheta);
    // ----------------------
    if (window.imglevel[parseInt(level)]) {
      const baseCount = window.baselevel.count
      const baseColumn = parseInt(window.baselevel.column);
      const imgAry = window.imglevel[parseInt(level)].imgAry
      for (var i = 0; i < baseCount; i++) {
        // 支援基底圖形為任意等分割
        var t = Math.floor(i / baseColumn) * window.sliceSize
        var x = baseX + ((i % (baseColumn)) * window.sliceSize) / scaleRate / rate / rateCanvas
        var y = t / scaleRate / rate / rateCanvas
        ctx.drawImage(
          imgAry[i],
          x,
          y,
          imgAry[i].width / scaleRate / rate / rateCanvas,
          imgAry[i].height / scaleRate / rate / rateCanvas
        )
      }
    }
    // ----------------------
    // ctx.rotate(rtheta * -1);
    // ----------------------
    var coordinate = leftTopCoord()
    if (window.theta !== 0) {
      coordinate = beforeRotateLeftTopCoord(window.theta, CenterCoord(), {
        x: 0,
        y: 0
      })
    }
    // -----------------------
    ctx.strokeStyle = 'white'
    ctx.beginPath()
    var x = baseX + coordinate.x / rateCanvas
    var y = coordinate.y / rateCanvas
    // var w = canvasMinimap.width / rateCanvas / zoom
    // var h = canvasMinimap.height / rateCanvas / zoom
    var w = canvas.width / rateCanvas / zoom
    var h = canvas.height / rateCanvas / zoom
    ctx.rect(x, y, w, h)
    ctx.stroke()
    // ------------------------
    ctx.strokeStyle = 'gray'
    ctx.beginPath()
    x = baseX + (coordinate.x - shiftByViewWidth(0, 0, 0, 0, 0, zoom)) / rateCanvas
    y = (coordinate.y - shiftByViewWidth(0, 0, 0, 0, 0, zoom)) / rateCanvas
    // const w = canvasMinimap.width / zoom
    // const h = canvasMinimap.height / zoom
    w = window.tempCanvasWidth / rateCanvas / zoom
    h = window.tempCanvasWidth / rateCanvas / zoom
    ctx.rect(x, y, w, h)
    ctx.stroke()
    // ----------------------
    // 使用旋轉後四個角座標畫線
    var lt = fabric.util.transformPoint({
      x: 0,
      y: 0
    }, fabric.util.invertTransform(canvas.viewportTransform))
    var rt = fabric.util.transformPoint({
      x: canvas.width,
      y: 0
    }, fabric.util.invertTransform(canvas.viewportTransform))
    var rb = fabric.util.transformPoint({
      x: canvas.width,
      y: canvas.height
    }, fabric.util.invertTransform(canvas.viewportTransform))
    var lb = fabric.util.transformPoint({
      x: 0,
      y: canvas.height
    }, fabric.util.invertTransform(canvas.viewportTransform))
    ctx.strokeStyle = 'rgb(70,130,180)'
    ctx.beginPath()
    ctx.moveTo(baseX + lt.x / rateCanvas, lt.y / rateCanvas);
    ctx.lineTo(baseX + rt.x / rateCanvas, rt.y / rateCanvas);
    ctx.lineTo(baseX + rb.x / rateCanvas, rb.y / rateCanvas);
    ctx.lineTo(baseX + lb.x / rateCanvas, lb.y / rateCanvas);
    ctx.closePath();
    ctx.stroke()
    drawMinimapLabel(ctx)
    // ----------------------------------
    // var levelInfo = window.imgInfo.partition.find(function (item) {
    //   return item.scaleRate < zoom || item.scaleRate === 1
    // })
    // var coord = beforeRotateLeftTopCoord(window.theta, CenterCoord(), {
    //   x: 0,
    //   y: 0
    // })
    // var levelR = parseInt(levelInfo.level);
    // var count = parseInt(levelInfo.count);
    // var column = parseInt(levelInfo.column);
    // var scaleRateR = levelInfo.scaleRate;
    // if (window.imglevel[parseInt(levelR)]) { // 如果可以則繪製參考線
    //   var imgAry = window.imglevel[parseInt(levelR)].imgAry
    //   // var imgAryBaseWidth = window.baselevel.slice_size[0]
    //   var imgAryBaseWidth = window.baselevel.resolution[0] // tempXXX
    //   var rateR = Math.ceil(imgAryBaseWidth / window.viewWidth) * rateCanvas;
    //   for (var i = 0; i < imgAry.length; i++) {
    //     if (count === 1) {
    //       var w, h, x, y
    //       w = imgAry[i].width / scaleRate / rateR;
    //       h = imgAry[i].height / scaleRate / rateR;
    //       x = baseX + 0
    //       y = 0
    //       ctx.strokeStyle = '#FF44AA'
    //       ctx.beginPath()
    //       ctx.moveTo(x, y);
    //       ctx.lineTo(x + w, y + w);
    //       ctx.stroke()
    //       ctx.beginPath();
    //       ctx.arc(x, y, 5, 0, 2 * Math.PI);
    //       ctx.fill()
    //     } else {
    //       var w = window.sliceSize / scaleRateR / rateR;
    //       var h = window.sliceSize / scaleRateR / rateR;
    //       var t = Math.floor(i / column) * window.sliceSize
    //       var x = baseX + ((i % (column)) * window.sliceSize) / scaleRateR / rateR
    //       var y = t / scaleRateR / rateR
    //       ctx.strokeStyle = '#FF44AA'
    //       ctx.beginPath()
    //       ctx.moveTo(x, y);
    //       ctx.lineTo(x + w, y + w);
    //       ctx.stroke()
    //       ctx.beginPath();
    //       ctx.fillStyle = '#000';
    //       ctx.arc(x, y, 5, 0, 2 * Math.PI);
    //       ctx.fill()
    //       ctx.font = "10px Arial";
    //       ctx.fillStyle = '#FFF';
    //       ctx.fillText(levelR + '_' + (t / window.sliceSize) + '_' + (i % (column)), x, y + 10);
    //       // ctx.fillText(levelR, x, y + 10);
    //       console.log(
    //         levelR + '_' + (t / window.sliceSize) + '_' + (i % (column)), boundaryIntersect({
    //           x: baseX + ((i % (column)) * window.sliceSize) / scaleRateR / rateR, // /rateR = / rate / rateCanvas
    //           y: y,
    //           w: window.sliceSize / scaleRateR / rateR,
    //           h: w
    //         }, {
    //           x: baseX + (coordinate.x - shiftByViewWidth(0, 0, 0, 0, 0, zoom)) / rateCanvas,
    //           y: (coordinate.y - shiftByViewWidth(0, 0, 0, 0, 0, zoom)) / rateCanvas,
    //           w: window.tempCanvasWidth / zoom / rateCanvas,
    //           h: window.tempCanvasWidth / zoom / rateCanvas
    //         }))
    //     }
    //   }
    // }
  }

  function drawMinimapLabel (ctx) {
    const that = this
    const canvasMinimap = document.getElementById('minimapCanvas')
    const canvas = edit.canvasView
    const scaleRate = 1
    const imgAryBaseWidth = window.baselevel.resolution[0]
    const rate = Math.ceil((imgAryBaseWidth / scaleRate) / canvas.width)
    const rateCanvas = Math.ceil(canvas.width / canvasMinimap.width)
    ctx.strokeStyle = 'rgba(70,130,180,0.9)'
    ctx.fillStyle = 'rgba(70,130,180,0.2)'
    ctx.lineWidth = 1
    // 縮圖置中，添加平移量
    const baseX = (canvasMinimap.width - imgAryBaseWidth / rate / rateCanvas) / 2

    const annotationLabelme = edit.export(edit.toFabricJson())
    console.log('annotationLabelme', annotationLabelme)
    var rateR = rateCanvas
    for (var i = 0; i < annotationLabelme.shapes.length; i++) {
      const item = annotationLabelme.shapes[i]
      var x, y, j, x1, y1, x2, y2, r
      if (item.shape_type === 'polygon') {
        ctx.strokeStyle = item.stroke
        ctx.fillStyle = edit.colorToRgbA(item.stroke, 0.2)
        ctx.beginPath()
        for (j = 0; j < item.points.length; j++) {
          x = baseX + item.points[j][0] / scaleRate / rateR
          y = item.points[j][1] / scaleRate / rateR
          if (j === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      } else if (item.shape_type === 'circle') {
        ctx.strokeStyle = item.stroke
        ctx.fillStyle = edit.colorToRgbA(item.stroke, 0.2)
        ctx.beginPath()
        x1 = baseX + item.points[0][0] / scaleRate / rateR
        y1 = item.points[0][1] / scaleRate / rateR
        x2 = baseX + item.points[1][0] / scaleRate / rateR
        y2 = item.points[1][1] / scaleRate / rateR
        r = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
        ctx.arc(x1, y1, r, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      } else if (item.shape_type === 'rectangle') {
        ctx.strokeStyle = item.stroke
        ctx.fillStyle = edit.colorToRgbA(item.stroke, 0.2)
        x1 = baseX + item.points[0][0] / scaleRate / rateR
        y1 = item.points[0][1] / scaleRate / rateR
        x2 = baseX + item.points[1][0] / scaleRate / rateR
        y2 = item.points[1][1] / scaleRate / rateR
        ctx.beginPath()
        ctx.rect(x1, y1, Math.abs(x1 - x2), Math.abs(y1 - y2))
        ctx.fill()
        ctx.stroke()
      }
    }
  }


  function shiftByViewWidth(w, h, tempCanvasWidth, tempCanvasHeight, rate, zoom) {
    w = window.viewWidth
    tempCanvasWidth = window.tempCanvasWidth
    if (!rate) {
      rate = 1.5;
    }
    if (!h) {
      h = w
    }
    if (!tempCanvasHeight) {
      tempCanvasHeight = tempCanvasWidth
    }
    return (tempCanvasWidth - w) / zoom / 2
  }


  function miniMapActive() {
    const canvasMinimap = document.getElementById('minimapCanvas')
    canvasMinimap.addEventListener('mousedown', pickPoint, false);
    // canvasMinimap.addEventListener('mousemove', drawing,   false);
    // canvasMinimap.addEventListener('mouseup',   stopDrawing, false);
    function pickPoint(e) {
      // var imgAryBaseWidth = window.baselevel.slice_size[0]
      var imgAryBaseWidth = window.baselevel.resolution[0] // tempXXX
      const rateCanvas = Math.ceil(canvas.width / canvasMinimap.width)
      const scaleRate = 1
      const rate = Math.ceil((imgAryBaseWidth / scaleRate) / canvas.width)
      // 縮圖置中，添加平移量
      const baseX = (canvasMinimap.width - imgAryBaseWidth / rate / rateCanvas) / 2
      var x = (e.offsetX - baseX) * rateCanvas
      var y = e.offsetY * rateCanvas
      // var pointer = canvas.getPointer({ x: 0, y: 0 });
      // var pointer = beforeRotateLeftTopCoord(window.theta, CenterCoord(), { x: 0, y: 0 })
      var pointer = CenterCoord()
      var ary = new Array(6)
      var ary = canvas.viewportTransform;
      var centerMoveMatirx = [1, 0, 0, 1, pointer.x - x, pointer.y - y]
      // var centerMoveMatirx = [1,0,0,1,10,10]
      ary = matrixProduct(ary, centerMoveMatirx) // 先平移
      canvas.setViewportTransform(ary);
      canvas.renderAll();
      clearTimeout(tt)
      tt = setTimeout(function () {
        var zoom = realZoom()
        var levelInfo = window.imgInfo.partition.find(function (item) {
          return item.scaleRate < zoom || item.scaleRate === 1
        })
        var area = {
          x: shiftDrawArea(),
          y: shiftDrawArea(),
          w: window.tempCanvasWidth,
          h: window.tempCanvasWidth
        }
        var coordinate = leftTopCoord()
        if (window.theta !== 0) {
          var tempAngle = window.theta
          rotateSwitch(0)
          coordinate = leftTopCoord()
          rotateSwitch(tempAngle)
        }
        loadImgByLevelAndCanvasArea(levelInfo, coordinate, zoom, area)
      })
    }
  }


  function selectViewEnd() {
    if (document.getElementById('selectView')) {
      var elem = document.getElementById("selectView");
      elem.parentNode.removeChild(elem);
    }
  }

  function selectView() {
    var canvasSelectTemplate
    if (document.getElementById('selectView')) {
      canvasSelectTemplate = document.getElementById('selectView')
    } else {
      canvasSelectTemplate = document.createElement('canvas')
      canvasSelectTemplate.id = 'selectView'
      canvasSelectTemplate.width = canvas.width
      canvasSelectTemplate.height = canvas.height
      canvasSelectTemplate.style = 'position:absolute;top:0px;left:0px;z-index:50;background:rgba(123,123,123,0.3);'
      document.getElementById('canvasParent').appendChild(canvasSelectTemplate)
    }
    var oX, endX, oXo, endXo
    var oY, endY, oYo, endYo
    var oW, oH, oWo, oHo
    var ctx = canvasSelectTemplate.getContext("2d");
    var startDrawing = false
    var startDraw = function (e) {
      const canvasMinimap = document.getElementById('minimapCanvas')
      const rateCanvas = Math.ceil(canvas.width / canvasMinimap.width)
      if (!startDrawing) {
        oX = e.offsetX
        oY = e.offsetY
        startDrawing = true
        var o = fabric.util.transformPoint({
          x: oX,
          y: oY
        }, fabric.util.invertTransform(canvas.viewportTransform))
        oXo = o.x
        oYo = o.y
        // circle (oXo,oYo, 3, 'deepskyblue')
      } else {
        startDrawing = false
        ctx.clearRect(0, 0, canvasSelectTemplate.width, canvasSelectTemplate.height)
        ctx.strokeStyle = '#FFFF00'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.rect(Math.min(oX, endX), Math.min(oY, endY), Math.abs(endX - oX), Math.abs(endY - oY))
        ctx.stroke()
        var o = fabric.util.transformPoint({
          x: endX,
          y: endY
        }, fabric.util.invertTransform(canvas.viewportTransform))
        endXo = o.x
        endYo = o.y
        // circle (endXo, endYo, 3, 'brown')
        var ary = new Array(6)
        var ary = canvas.viewportTransform;
        var pointer = CenterCoord()
        var center = {
          x: (oXo + endXo) / 2,
          y: (oYo + endYo) / 2
        }
        // circle (center.x, center.y, 3, 'fuchsia')
        var centerMoveMatirx = [1, 0, 0, 1, pointer.x - center.x, pointer.y - center.y]
        ary = matrixProduct(ary, centerMoveMatirx) // 先平移
        // var rtheta = parseInt(360 - window.theta) * Math.PI / 180
        // var rotateMatrix = [Math.cos(rtheta), Math.sin(rtheta), -1*Math.sin(rtheta), Math.cos(rtheta), 0, 0]
        // ary = matrixProduct(ary, rotateMatrix) // 先反旋轉
        // var rotateValue = window.theta
        // rotateSwitch(rtheta)
        // ary = matrixProduct(ary, centerMoveMatirx) // 先平移
        canvas.setViewportTransform(ary);
        // var rtheta = parseInt(window.theta) * Math.PI / 180
        var rtheta = parseInt(360 - window.theta) * Math.PI / 180
        var rotateValue = window.theta
        rotateSwitch(0)
        var zoom = realZoom()
        // zoom = 5
        var zoomRateW = canvas.width / oW
        var zoomRateH = canvas.height / oH
        var zoomRate = Math.min(zoomRateW, zoomRateH)
        newZoomToPoint(CenterCoord(), zoom * zoomRate)
        rotateSwitch(rotateValue)
        canvas.renderAll();
        clearTimeout(tt)
        tt = setTimeout(function () {
          var zoom = realZoom()
          var levelInfo = window.imgInfo.partition.find(function (item) {
            return item.scaleRate < zoom || item.scaleRate === 1
          })
          var area = {
            x: shiftDrawArea(),
            y: shiftDrawArea(),
            w: window.tempCanvasWidth,
            h: window.tempCanvasWidth
          }
          var coordinate = leftTopCoord()
          if (window.theta !== 0) {
            var tempAngle = window.theta
            rotateSwitch(0)
            coordinate = leftTopCoord()
            rotateSwitch(tempAngle)
          }
          loadImgByLevelAndCanvasArea(levelInfo, coordinate, zoom, area)
        }, 100)
        selectViewEnd()
      }
    }
    var drawing = function (e) {
      if (startDrawing) {
        endX = e.offsetX
        endY = e.offsetY
        ctx.clearRect(0, 0, canvasSelectTemplate.width, canvasSelectTemplate.height)
        ctx.strokeStyle = '#FFFF00'
        ctx.lineWidth = 1
        oW = Math.abs(endX - oX)
        oH = Math.abs(endY - oY)
        ctx.beginPath()
        ctx.rect(Math.min(oX, endX), Math.min(oY, endY), Math.abs(endX - oX), Math.abs(endY - oY))
        ctx.stroke()
      }
    }
    var stopDrawing = function (e) {}

    canvasSelectTemplate.addEventListener('mousedown', startDraw, false);
    canvasSelectTemplate.addEventListener('mousemove', drawing, false);
    canvasSelectTemplate.addEventListener('mouseup', stopDrawing, false);
  }


  function loadInfo() {

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
      window.imgInfo = JSON.parse(this.response)
      window.imglevel = new Array(window.imgInfo.partition.length)
      var base
      // 選擇基底 base level
      if (window.baselevelSelect) {
        base = window.imgInfo.partition.find(function (item) {
          return item.count == 1
        })
        if (!base) {
          base = window.imgInfo.partition[window.imgInfo.partition.length - 1]
        }
      } else {
        base = window.imgInfo.partition[window.imgInfo.partition.length - 1]
      }
      // 基底可以是任何層級
      // base = window.imgInfo.partition[3]
      window.baselevel = base;
      window.imgInfo.partition.forEach(function (item) {
        item.scaleRate = window.baselevel.downsample / item.downsample
      })
      // 圖移置中
      // const imgAryBaseWidth = window.baselevel.slice_size[0]
      // window.sliceSize = window.baselevel.slice_size[0]
      window.sliceSize = window.imgInfo.partition_resolution[0]
      const imgAryBaseWidth = window.baselevel.resolution[0] // tempXXXX
      const rate = Math.ceil(imgAryBaseWidth / canvas.width)
      const x = (imgAryBaseWidth / rate - canvas.width) / 2
      canvas.absolutePan({
        x: x,
        y: 0
      })
      // 下載圖片
      var zoom = realZoom();
      var area = {
        x: shiftDrawArea(),
        y: shiftDrawArea(),
        w: window.tempCanvasWidth,
        h: window.tempCanvasWidth
      }
      var coordinate = leftTopCoord()
      if (window.theta !== 0) {
        var tempAngle = window.theta
        rotateSwitch(0)
        coordinate = leftTopCoord()
        rotateSwitch(tempAngle)
      }
      loadImgByLevelAndCanvasArea(window.baselevel, coordinate, zoom, area)
    });
    oReq.open("GET", window.imagePath + "_slice_info_simple.json");
    oReq.send();
  }

  // load all
  function loadImgByLevel(levelInfo) {
    var count = levelInfo.count;
    var level = parseInt(levelInfo.level);
    // if(level < 3) {return false}
    var row = parseInt(levelInfo.row);
    var column = parseInt(levelInfo.column);
    var imgAry = new Array(count);
    for (var i = 0; i < row; i++) {
      for (var j = 0; j < column; j++) {
        var img = new Image();
        img.comp = false;
        img.onload = function () {
          this.comp = true;
          // renderCanvas()
          // drawTempCanvasByLevel(levelInfo)
        };
        img.n = level + '_' + i + '_' + j
        img.src = window.imagePath + "_" + level + '_' + i + '_' + j + ".jpg";
        imgAry[i * (column) + j] = img
      }
    }
    window.imglevel[parseInt(levelInfo.level)] = {}
    window.imglevel[parseInt(levelInfo.level)].imgAry = imgAry
  }

  function beforeRotateLeftTopCoord(rotateValue, pointer, transPoint) {
    if (!pointer) {
      pointer = CenterCoord()
    }
    var rtheta = parseInt(360 - rotateValue) * Math.PI / 180
    var ary = new Array(6)
    var rotateMatrix = [Math.cos(rtheta), Math.sin(rtheta), -1 * Math.sin(rtheta), Math.cos(rtheta), 0, 0]
    var rotateOrigianlCenter = pointRotate(rotateMatrix, pointer)
    var centerMoveMatirx = [1, 0, 0, 1, pointer.x - rotateOrigianlCenter.x, pointer.y - rotateOrigianlCenter.y]
    ary = canvas.viewportTransform
    ary = matrixProduct(ary, centerMoveMatirx) // 先平移
    ary = matrixProduct(ary, rotateMatrix) // 再旋轉
    return fabric.util.transformPoint(transPoint, fabric.util.invertTransform(ary))
  }


  function CenterCoord() {
    // 補: 改用canvas中心，帶入getPointer
    // var zoom=canvas.getZoom()
    var zoom = realZoom()
    // return{
    //     x:fabric.util.invertTransform(canvas.viewportTransform)[4]+(canvas.width/zoom)/2,
    //     y:fabric.util.invertTransform(canvas.viewportTransform)[5]+(canvas.height/zoom)/2
    // }
    return fabric.util.transformPoint({
      x: canvas.width / 2,
      y: canvas.height / 2
    }, fabric.util.invertTransform(canvas.viewportTransform))
  }

  function pointRotate(A, point) {
    return {
      x: A[0] * point.x + A[2] * point.y + A[4],
      y: A[1] * point.x + A[3] * point.y + A[5]
    }
  }

})()