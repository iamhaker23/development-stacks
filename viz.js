//With thanks to https://tutsplus.com/authors/john-negoita for Piechart and Pieslice functions 

var concentricPieCharts = function(options){
    this.options = options;
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.charts = this.options.charts;
    this.drawables = [];
    this.countPerLayerPerChart = [];
    
    this.getConcentricallyRelatedSliceAngle = function(cindex, slice){
        if (cindex <= Object.keys(this.charts).length-2){
            var out = 0;
            for (var key in this.charts[cindex+1]["slices"][slice]){
                out += this.charts[cindex+1]["slices"][slice][key].value;
            }
            return out;
        }else{
            return 0;
        }
    }
    
    var i = 0;
    for (var key in this.charts){
        var currObj = (Object.keys(this.charts[key]).indexOf("obj")!=-1)?this.charts[key]["obj"]:null;
        if (currObj == null){
            currObj = {
                        doughnutHoleSize:this.charts[0]["obj"].doughnutHoleSize,
                        width:(this.charts[0]["obj"].width*((Math.pow(this.charts[0]["obj"].doughnutHoleSize, i))-this.charts[0]["obj"].circlePadding)),
                        height:(this.charts[0]["obj"].height*((Math.pow(this.charts[0]["obj"].doughnutHoleSize, i))-this.charts[0]["obj"].circlePadding)),
                        centreX:this.charts[0]["obj"].centreX,
                        centreY:this.charts[0]["obj"].centreY,
                        centreXoffset:this.charts[0]["obj"].centreXoffset,
                        centreYoffset:this.charts[0]["obj"].centreYoffset,
                        percentages:this.charts[0]["obj"].percentages,
                        autocolour: this.charts[0]["obj"].autocolour
                    };
        }
        
        var total_value = 0;
        var currIndex = this.options.charts.length-1;
        for (slice in this.options.charts[currIndex]["slices"]){
            for (var categ in this.options.charts[currIndex]["slices"][slice]){
                var val = this.options.charts[currIndex]["slices"][slice][categ].value;
                //derive total_value from innermost (a.k.a. last) chart
                total_value += val;
            }
        }
        
        var tmp = new Piechart(
            {
                ctx:this.ctx,
                data: this.charts[key]["slices"],
                obj: currObj,
                total_value: total_value,
                concentric: this,
                cindex: i
            }
        );
        this.drawables[i++] = tmp;
    }
    
    this.draw = function(){
        for (var key in this.drawables){
            this.drawables[key].draw();
        }
    }
    
}

var Piechart = function(options){
    this.options = options;
    this.ctx = this.options.ctx;
    this.concentric = options.concentric;
    this.cindex = options.cindex;
 
    this.draw = function(){
        var total_value = this.options.total_value;
        var color_index = 0;
        this.colours = [];
        var labels = [];
        
        for (slice in this.options.data){
            var myColours = {};
            for (var categ in this.options.data[slice]){
                if (this.options["obj"].autocolour){
                    myColours[categ] = '#'+Math.max(Math.ceil(Math.random()*255), 100).toString(16)+Math.max(Math.ceil(Math.random()*255), 100).toString(16)+(255).toString(16);
                }else{
                    myColours[categ] = this.options.data[slice][categ].colour;
                }
            }
            this.colours[slice] = myColours;
        }
        
        var count = 0;
        var start_angle = 0;
        for (slice in this.options.data){
            var myLabel = {};
            if (Object.keys(this.options.data[slice]).length > 0){
                for (categ in this.options.data[slice]){
                
                    val = this.options.data[slice][categ].value;
                    subsliceProportion = Object.keys(this.options.data[slice]).length;
                    var slice_angle = (2 * Math.PI * val / total_value)/subsliceProportion;
                    var pieRadius = Math.min(this.options["obj"].width/2,this.options["obj"].height/2);
                    var xCentre = (this.options["obj"].centreX) + (this.options["obj"].centreXoffset);
                    var yCentre = (this.options["obj"].centreY) + (this.options["obj"].centreYoffset);
                    
                    var txt = (this.options["obj"].percentages)?Math.round(100 * val / total_value)+"%":categ;
                    
                    myLabel[categ] = {
                        labelText: txt,
                        labelX: xCentre + (pieRadius * 0.9 * Math.cos(start_angle + slice_angle/2)),
                        labelY: yCentre + (pieRadius * 0.9 * Math.sin(start_angle + slice_angle/2)),
                    };
                    
                    drawPieSlice(
                        this.ctx,
                        xCentre,
                        yCentre,
                        pieRadius,
                        start_angle,
                        start_angle+slice_angle,
                        this.colours[slice][categ],
                        categ
                    );
         
                    start_angle += slice_angle;
                    count++;
                }
            }
            else{
                var val = this.concentric.getConcentricallyRelatedSliceAngle(this.cindex, slice);
                var slice_angle = (2 * Math.PI * val / total_value);
                start_angle += slice_angle;
            }
            labels[slice] = myLabel;
        }
        
        //drawing a white circle over the chart
        //to create the doughnut chart
        if (this.options["obj"].doughnutHoleSize){
            drawPieSlice(
                this.ctx,
                xCentre,
                yCentre,
                this.options["obj"].doughnutHoleSize * pieRadius,
                0,
                2 * Math.PI,
                "#FFF"
            );
        }
        
        for(var slice in labels){
            for (lbl in labels[slice]){
                this.ctx.fillStyle = "black";
                //this.ctx.strokeStyle = "black";
                this.ctx.font = "bold 0.75em Verdana";
                var txt = "•"+labels[slice][lbl].labelText;
                this.ctx.fillText(txt,labels[slice][lbl].labelX,labels[slice][lbl].labelY);
                //this.ctx.strokeText(txt,labels[slice][lbl].labelX,labels[slice][lbl].labelY);
            }
        }
 
    }
}

function drawPieSlice(ctx,centerX, centerY, radius, startAngle, endAngle, color, title=""){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX,centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
}

function mouseMove(e)
{
    var mouseX, mouseY;

    if(e.offsetX) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
    else if(e.layerX) {
        mouseX = e.layerX;
        mouseY = e.layerY;
    }
    
    var ctx = (document.getElementById(e.target.id)).getContext("2d");
    if (isMouseDown){
        
        ctx.lineTo(mouseX,mouseY); 
        ctx.stroke(); // Draw it
    }
}

function mouseDown(e)
{
    var mouseX, mouseY;

    if(e.offsetX) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
    else if(e.layerX) {
        mouseX = e.layerX;
        mouseY = e.layerY;
    }
    isMouseDown = true;
    var ctx = (document.getElementById(e.target.id)).getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle="black"; // Purple path
    ctx.moveTo(mouseX,mouseY);

}

function mouseUp(e)
{   
    isMouseDown = false; 
}

function mouseOut(e){
    isMouseDown = false;
}