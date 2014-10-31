
Drawing = {
    rectangle: function(ctx, centerPt, halfWidth, halfHeight, fillMode) {
        ctx.beginPath();
        ctx.rect(centerPt.x - halfWidth, centerPt.y - halfHeight, 2 * halfWidth, 2 * halfHeight);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    square: function(ctx, centerPt, r, fillMode) {
        ctx.beginPath();
        ctx.rect(centerPt.x - r, centerPt.y - r, 2 * r, 2 * r);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    ellipse: function(ctx, centerPt, halfWidth, halfHeight, fillMode) {
        ctx.beginPath();
        ctx.moveTo(centerPt.x - halfWidth, centerPt.y);
        ctx.bezierCurveTo(centerPt.x - halfWidth, centerPt.y - halfHeight, centerPt.x + halfWidth, centerPt.y - halfHeight, centerPt.x + halfWidth, centerPt.y);
        ctx.bezierCurveTo(centerPt.x + halfWidth, centerPt.y + halfHeight, centerPt.x - halfWidth, centerPt.y + halfHeight, centerPt.x - halfWidth, centerPt.y);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    circle: function(ctx, centerPt, r, fillMode) {
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y, r, 2 * Math.PI, false);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    triangle: function(ctx, centerPt, r, fillMode) {
        ctx.beginPath();
        ctx.moveTo(centerPt.x, centerPt.y - r);
        ctx.lineTo(centerPt.x + r, centerPt.y + r);
        ctx.lineTo(centerPt.x - r, centerPt.y + r);
        ctx.lineTo(centerPt.x, centerPt.y - r);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    fillText: function(ctx, centerPt, text) {
        ctx.fillText(text, centerPt.x, centerPt.y);
    }
};

;(function() {
    var canvas = document.getElementById("drawing")
    var drawing = canvas.getContext('2d');

    function mapLength(obj) {
        var size = 0;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    }

    /*
    Parse multiple rows of text.
    */
    function parse(input)  {
        var rows = input.split(/\n/);

        var instructions = new Array();
        var metaInstructions = {
            background: { value: "white", shape: "background" },
            lineStyle: { value: "solid", shape: "lines" },
            fillMode: { value: "empty", shape: "shapes" }
        };

        rows.forEach(function(row) {
            var trimmedRow = row.trim();

            if (trimmedRow.substr(0, 1) == '-') return; // ignore comments

            var rowInstructions = parseRow(trimmedRow);

            if (rowInstructions.metaInstructions) {
                for (var key in rowInstructions.metaInstructions) {
                    metaInstructions[key] = rowInstructions.metaInstructions[key];
                }
            }

            if (rowInstructions.drawingInstructions) {
                instructions.push({ drawingInstructions: rowInstructions.drawingInstructions, metaInstructions: JSON.parse(JSON.stringify(metaInstructions)) });
            }
        });

        return instructions;
    }

    function newProperties() {
        return {
            color: null,
            textColor:  null,
            size: null,
            lineStyle: null,
            fillMode: null,
            heightModifier: null,
            cardinality: 1,
            texts: new Array()
        };
    }

    /*
    Parse a single row of text.
    Returns an array of meta instructions and an array of drawing instructions.
    */
    function parseRow(row) {
        var tokens = row.split(/\s+/);

        var metaInstructions = new Object();
        var drawingInstructions = new Array();
        var properties = newProperties();

        tokens.forEach(function(token) {
            switch (token) {
                case "background":
                    metaInstructions[token] = { value: properties.color, shape: token };
                    properties = newProperties();
                    return;

                case "lines":
                    metaInstructions[token] = { value: properties.lineStyle, shape: token };
                    return;

                case "shapes":
                    metaInstructions[token] = { value: properties.fillMode, shape: token };
                    return;

                case "blank":
                    drawingInstructions.push({ shape: "blank" });
                    break;

                case "square": case "rectangle": case "circle": case "ellipse": case "triangle":
                case "squares": case "rectangles": case "circles": case "ellipses": case "triangles":
                    for (var i = 0; i < properties.cardinality; i++) {
                        drawingInstructions.push({ 
                            text: properties.texts.length > i ? properties.texts[i] : null, 
                            color: properties.color,
                            textColor: properties.textColor,
                            size: properties.size, 
                            lineStyle: properties.lineStyle,
                            fillMode: properties.fillMode,
                            heightModifier: properties.heightModifier,
                            shape: token
                        });
                    };
                    properties = newProperties();
                    return;
            }

            switch (token) {
                case "aqua": case "black": case "blue": case "fuchsia": case "gray": case "green": case "lime":  case "maroon": case "navy":
                case "olive": case "orange": case "purple": case "red": case "silver": case "teal": case "white": case "yellow":
                    properties.color = token;
                    return;

                case "tiny": case "small": case "big":
                    properties.size = token;
                    return;

                case "dashed": case "dotted": case "solid":
                    properties.lineStyle = token;
                    return;

                case "filled": case "empty":
                    properties.fillMode = token;
                    return;

                case "full-height":
                    properties.heightModifier = token;
                    return;
            }

            if (token.search(/^".*"$/) == 0 || token.search(/^'.*'$/) == 0) {
                properties.texts.push(token.substr(1, token.length - 2));
                if (properties.color != null) {
                    properties.textColor = properties.color;
                    properties.color = null;
                }
            }

            if (!isNaN(token)) {
                properties.cardinality = parseInt(token);
                return;
            }
        });

        return { 
            metaInstructions : mapLength(metaInstructions) > 0 ? metaInstructions : null,
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

        var rowCount = instructions.length;

        var currentRow = 0;
        instructions.forEach(function(rowInstructions) {
            renderRow(rowInstructions, currentRow, rowCount);
            currentRow++;
        });
    }

    /*
    Render a single row of instructions.
    Accepts an array of instructions.
    */
    function renderRow(rowInstructions, currentRow, rowCount) {
        var columnCount = rowInstructions.drawingInstructions.length;

        for (var key in rowInstructions.metaInstructions) {
            renderInstruction(rowInstructions.metaInstructions[key], currentRow, currentColumn, rowCount, columnCount);
        }

        var currentColumn = 0;
        rowInstructions.drawingInstructions.forEach(function(instruction) {
            renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount);
            currentColumn++;
        });

    }

    /*
    Calculate the center of a shape (e.g. for circles)
    */
    function calcCenter(currentRow, currentColumn, rowCount, columnCount, heightModifier) {
        var cellWidth = canvas.width / columnCount;
        var cellHeight = canvas.height / rowCount;

        switch (heightModifier) {
            case "full-height":
                return { 
                    x: currentColumn * cellWidth + cellWidth / 2,
                    y: canvas.height / 2
                };

            default:
                return { 
                    x: currentColumn * cellWidth + cellWidth / 2,
                    y: currentRow * cellHeight + cellHeight / 2
                };
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

    function calcHalfHeight(rowCount, size, heightModifier) {
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

        switch (heightModifier) {
            case "full-height":
                return canvas.height / 2 * factor;

            default:
                return canvas.height / rowCount / 2 * factor;
        }
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

    function setLineStyle(lineStyle) {
        switch (lineStyle) {
            case "dashed":
                drawing.setLineDash([6]);
                break;
            case "dotted":
                drawing.setLineDash([2, 2]);
                break;
            case "solid":                    
                drawing.setLineDash([]);
                break;
        }
    }

    /*
    Render a single instruction.
    */
    function renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        drawing.fillStyle = drawing.strokeStyle = (instruction.color != null ? instruction.color : "black");

        if (instruction.lineStyle) {
            setLineStyle(instruction.lineStyle);
        }

        switch (instruction.shape) {
            case "background":
                drawing.fillStyle = instruction.value;
                drawing.fillRect(0, canvas.height * currentRow / rowCount, canvas.width, canvas.height / rowCount);
                break;

            case "lines":
                setLineStyle(instruction.value);
                break;

            case "shapes":
                canvas.fillMode = instruction.value;
                break;

            case "square":
            case "squares":
                Drawing.square(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier), 
                    calcRadius(rowCount, columnCount, instruction.size), instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "rectangle":
            case "rectangles":
                Drawing.rectangle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier), 
                    calcHalfWidth(columnCount, instruction.size), calcHalfHeight(rowCount, instruction.size, instruction.heightModifier),
                    instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "circle":
            case "circles":
                Drawing.circle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier), 
                    calcRadius(rowCount, columnCount, instruction.size), instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "ellipse":
            case "ellipses":
                Drawing.ellipse(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier), 
                    calcHalfWidth(columnCount, instruction.size), calcHalfHeight(rowCount, instruction.size, instruction.heightModifier),
                    instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "triangle":
            case "triangles":
                Drawing.triangle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier), 
                    calcRadius(rowCount, columnCount, instruction.size), instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;
        }

        if (instruction.text) {
            drawing.fillStyle = instruction.textColor ? instruction.textColor : "black";
            drawing.font = calcFontSize(rowCount, columnCount, instruction.size) + "pt Arial";
            Drawing.fillText(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier), instruction.text);
        }
    }

    window.onload = function() {
        var input = document.getElementById("input");

        var draw = function() {
            instructions = parse(input.value);
            render(instructions); 

            window.requestAnimationFrame(draw);
        };

        window.requestAnimationFrame(draw);
    };
})();