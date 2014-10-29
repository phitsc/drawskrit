
Drawing = {
    fillRectangle: function(ctx, centerPt, halfWidth, halfHeight) {
        ctx.fillRect(centerPt.x - halfWidth, centerPt.y - halfHeight, 2 * halfWidth, 2 * halfHeight);
    },

    fillSquare: function(ctx, centerPt, r) {
        ctx.fillRect(centerPt.x - r, centerPt.y - r, 2 * r, 2 * r);
    },

    fillEllipse: function(ctx, centerPt, halfWidth, halfHeight) {
        ctx.beginPath();
        ctx.moveTo(centerPt.x - halfWidth, centerPt.y);
        ctx.bezierCurveTo(centerPt.x - halfWidth, centerPt.y - halfHeight, centerPt.x + halfWidth, centerPt.y - halfHeight, centerPt.x + halfWidth, centerPt.y);
        ctx.bezierCurveTo(centerPt.x + halfWidth, centerPt.y + halfHeight, centerPt.x - halfWidth, centerPt.y + halfHeight, centerPt.x - halfWidth, centerPt.y);
        ctx.fill();
        ctx.stroke();
    },

    fillCircle: function(ctx, centerPt, r) {
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y, r, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    },

    fillText: function(ctx, centerPt, text) {
        ctx.fillText(text, centerPt.x, centerPt.y);
    }
};

;(function() {
    var canvas = document.getElementById("drawing")
    var drawing = canvas.getContext('2d');

    /*
    Parse multiple rows of text.
    Returns an array of meta instructions and an array of arrays of drawing instructions.
    */
    function parse(input)  {
        var rows = input.split(/\n/);

        var metaInstructions = new Array();
        var drawingInstructions = new Array();

        rows.forEach(function(row) {
            var rowInstructions = parseRow(row);

            if (rowInstructions.metaInstructions) {
                metaInstructions = metaInstructions.concat(rowInstructions.metaInstructions);
            }

            if (rowInstructions.drawingInstructions) {
                drawingInstructions.push(rowInstructions.drawingInstructions);
            }
        });

        return { metaInstructions: metaInstructions, drawingInstructions: drawingInstructions };
    }

    /*
    Parse a single row of text.
    Returns an array of meta instructions and an array of drawing instructions.
    */
    function parseRow(row) {
        var tokens = row.split(/\s+/);

        var metaInstructions = new Array();
        var drawingInstructions = new Array();

        var color = null;
        var textColor = null;
        var size = null;

        var cardinality = 1;
        var texts = new Array();

        tokens.forEach(function(token) {
            switch (token) {
                case "background": case "border":
                    metaInstructions.push({ color: color, shape: token});
                    color = textColor = size = null;
                    cardinality = 1;
                    texts = new Array();
                    return;

                case "square": case "rectangle": case "circle": case "ellipse":
                case "squares": case "rectangles": case "circles": case "ellipses":
                    for (var i = 0; i < cardinality; i++) {
                        drawingInstructions.push({ 
                            text: texts.length > i ? texts[i] : null, 
                            color: color,
                            textColor: textColor,
                            size: size, 
                            shape: token
                        });
                    };
                    color = textColor = size = null;
                    cardinality = 1;
                    texts = new Array();
                    return;
            }

            switch (token) {
                case "aqua": case "black": case "blue": case "fuchsia": case "gray": case "green": case "lime":  case "maroon": case "navy":
                case "olive": case "orange": case "purple": case "red": case "silver": case "teal": case "white": case "yellow":
                    color = token;
                    return;
            }

            switch (token) {
                case "tiny": case "small": case "big":
                size = token;
                return;
            }

            if (token.search(/^".*"$/) == 0 || token.search(/^'.*'$/) == 0) {
                texts.push(token.substr(1, token.length - 2));
                if (color != null) {
                    textColor = color;
                    color = null;
                }
            }

            if (!isNaN(token)) {
                cardinality = parseInt(token);
                return;
            }
        });

        //console.log(drawingInstructions);

        return { 
            metaInstructions : metaInstructions.length > 0 ? metaInstructions : null,
            drawingInstructions: drawingInstructions.length > 0 ? drawingInstructions : null
        };
    }

    /*
    Render multiple rows of instructions.
    Accepts an array of arrays of instructions.
    */
    function render(instructions) {
        drawing.clearRect(0, 0, canvas.width, canvas.height);

        drawing.textAlign = "center";
        drawing.textBaseline = "middle";

        instructions.metaInstructions.forEach(function(instruction) {
            renderInstruction(instruction);
        });

        var rowCount = instructions.drawingInstructions.length;

        var currentRow = 0;
        instructions.drawingInstructions.forEach(function(rowInstruction) {
            renderRow(rowInstruction, currentRow, rowCount);
            currentRow++;
        });
    }

    /*
    Render a single row of instructions.
    Accepts an array of instructions.
    */
    function renderRow(rowInstructions, currentRow, rowCount) {
        var columnCount = rowInstructions.length;

        var currentColumn = 0;
        rowInstructions.forEach(function(instruction) {
            renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount);
            currentColumn++;
        });

    }

    /*
    Calculate the center of a shape (e.g. for circles)
    */
    function calcCenter(currentRow, currentColumn, rowCount, columnCount) {
        var cellWidth = canvas.width / columnCount;
        var cellHeight = canvas.height / rowCount;

        return { 
            x: currentColumn * cellWidth + cellWidth / 2,
            y: currentRow * cellHeight + cellHeight / 2
        }
    }

    /* 
    Calculate a shapes radius including specified size
    */
    function calcRadius(rowCount, columnCount, size) {
        var factor = 0.75;

        switch (size) {
            case "big":
                factor = 1.0;
                break;

            case "small":
                factor = 0.5;
                break;

            case "tiny":
                factor = 0.25;
                break;
        }

        return Math.min(canvas.width / columnCount / 2, canvas.height / rowCount / 2) * factor;
    }

    function calcHalfWidth(columnCount, size) {
        var factor = 0.8;

        switch (size) {
            case "big":
                factor = 1.0;
                break;

            case "small":
                factor = 0.55;
                break;

            case "tiny":
                factor = 0.3;
                break;
        }

        return canvas.width / columnCount / 2 * factor;
    }

    function calcHalfHeight(rowCount, size) {
        var factor = 0.7;

        switch (size) {
            case "big":
                factor = 0.95;
                break;

            case "small":
                factor = 0.45;
                break;

            case "tiny":
                factor = 0.2;
                break;
        }

        return canvas.height / rowCount / 2 * factor;
    }

    function calcFontSize(rowCount, columnCount, size) {
        var factor = 0.75;

        switch (size) {
            case "big":
                factor = 1.0;
                break;

            case "small":
                factor = 0.5;
                break;

            case "tiny":
                factor = 0.25;
                break;
        }

        return Math.min(canvas.width / columnCount / 8, canvas.height / rowCount / 8) * factor;  
    }

    /*
    Render a single instruction.
    */
    function renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        drawing.fillStyle = drawing.strokeStyle = (instruction.color != null ? instruction.color : "black");

        switch (instruction.shape) {
            case "background":
                drawing.fillRect(0, 0, canvas.width, canvas.height);
                break;

            case "square":
            case "squares":
                Drawing.fillSquare(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), calcRadius(rowCount, columnCount, instruction.size));
                break;

            case "rectangle":
            case "rectangles":
                Drawing.fillRectangle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), 
                    calcHalfWidth(columnCount, instruction.size), calcHalfHeight(rowCount, instruction.size));
                break;

            case "circle":
            case "circles":
                Drawing.fillCircle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), calcRadius(rowCount, columnCount, instruction.size));
                break;

            case "ellipse":
            case "ellipses":
                Drawing.fillEllipse(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), 
                    calcHalfWidth(columnCount, instruction.size), calcHalfHeight(rowCount, instruction.size));
                break;
        }

        if (instruction.text) {
            drawing.fillStyle = instruction.textColor ? instruction.textColor : "black";
            drawing.font = calcFontSize(rowCount, columnCount, instruction.size) + "pt Arial";
            Drawing.fillText(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), instruction.text);
        }
    }

    window.onload = function() {
        var input = document.getElementById("input");
        input.onkeypress = function() {
            instructions = parse(input.value);
            render(instructions);
        };
    };
})();