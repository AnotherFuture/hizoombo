(function () {
  var objOption = {
    // activeJsonTextId: 'hiActiveJsonArea',
    stroke: 'rgb(70,130,180)',
    endDraw: function () {
      edit.changeCanvasProperty(true, false);
      edit.changeSelectableStatus(true);
      edit.viewEvent();
    },
    onSelected: function (opt) {

    }
  };

  $("#btnRect").click(function () {
    edit.fabricObjDefaultOverride({stroke: 'rgb(70,130,180)', fill: 'transparent'})
    edit.removeCanvasEvents();
    edit.changeSelectableStatus(false);
    edit.changeCanvasProperty(false, false);
    var squrect = new edit.Rectangle(edit, objOption);
  });

  $("#btnEllipse").click(function () {
    edit.fabricObjDefaultOverride({stroke: 'rgb(70,130,180)', fill: 'transparent'})
    edit.removeCanvasEvents();
    edit.changeSelectableStatus(false);
    edit.changeCanvasProperty(false, false);
    var circle = new edit.Circle(edit, objOption);
  });

  
  $("#btnPolygon").click(function () {
    edit.fabricObjDefaultOverride({stroke: 'rgb(70,130,180)', fill: 'transparent'})
    edit.removeCanvasEvents();
    edit.changeSelectableStatus(false);
    edit.changeCanvasProperty(false, false);
    var circle = new edit.Polygon(edit, objOption);
  });
})()