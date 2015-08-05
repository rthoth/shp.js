# ishp

---

A spatial indexed (qix file) Shapefile reader.

ishp uses qix quadtree file, you can use [mapserver](http://mapserver.org/utilities/shptree.html) or [QGIS](http://www.qgis.org/) to create a qix file.

* A little example:

```js
 var ishp = require('ishp');

 var brazil = new ishp.ShapeFile('brazil.shp');

 brazil.intersects(geometry, function(err, feature) {
   if (err)
    console.log(err);
   else {
    console.log(feature.properties);
   }
 })...

```

# [References](https://github.com/rthoth/ishp/wiki)
* [ShapeFile](https://github.com/rthoth/ishp/wiki/ShapeFile-Reference)
* [Qix format](https://github.com/rthoth/ishp/wiki/Qix-Format)
