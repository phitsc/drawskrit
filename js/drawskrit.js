"use strict";

function Drawing(canvas)  {
    var ctx = canvas.getContext('2d');

    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin     = "round";
    ctx.lineCap      = "round";

    return {
        clear: function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },

        setLineDash: function(value) {
            ctx.setLineDash(value);
        },

        setLineWidth: function(value) {
            ctx.lineWidth = value;
        },

        setFillStyle: function(value) {
            ctx.fillStyle = value;
        },

        setStrokeStyle: function(value) {
            ctx.strokeStyle = value;
        },

        setFont: function(value) {
            ctx.font = value;
        },

        fillRectangle: function(centerPt, halfWidth, halfHeight) {
            ctx.fillRect(centerPt.x - halfWidth, centerPt.y - halfHeight, 2 * halfWidth, 2 * halfHeight);
        },

        rectangle: function(centerPt, halfWidth, halfHeight, fillMode, rotation) {
            ctx.save();
            ctx.translate(centerPt.x, centerPt.y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.beginPath();
            ctx.rect(0 - halfWidth, 0 - halfHeight, 2 * halfWidth, 2 * halfHeight);
            if (fillMode == "filled") ctx.fill();
            ctx.stroke();
            ctx.restore();
        },

        square: function(centerPt, r, fillMode, rotation) {
            this.rectangle(centerPt, r, r, fillMode, rotation);
        },

        ellipse: function(centerPt, halfWidth, halfHeight, fillMode, rotation) {
            ctx.save();
            ctx.translate(centerPt.x, centerPt.y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0 - halfWidth, 0);
            ctx.bezierCurveTo(0 - halfWidth, 0 - halfHeight, 0 + halfWidth, 0 - halfHeight, 0 + halfWidth, 0);
            ctx.bezierCurveTo(0 + halfWidth, 0 + halfHeight, 0 - halfWidth, 0 + halfHeight, 0 - halfWidth, 0);
            if (fillMode == "filled") ctx.fill();
            ctx.stroke();
            ctx.restore();
        },

        smile: function(centerPt, halfWidth, halfHeight, fillMode, rotation) {
            ctx.save();
            ctx.translate(centerPt.x, centerPt.y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0 - halfWidth, 0 - halfHeight);
            ctx.bezierCurveTo(0 - halfWidth, 0 + halfHeight, 0 + halfWidth, 0 + halfHeight, 0 + halfWidth, 0 - halfHeight);
            ctx.bezierCurveTo(0 + halfWidth, 0, 0 - halfWidth, 0, 0 - halfWidth, 0 - halfHeight);
            if (fillMode == "filled") ctx.fill();
            ctx.stroke();
            ctx.restore();
        },

        circle: function(centerPt, r, fillMode) {
            ctx.beginPath();
            ctx.arc(centerPt.x, centerPt.y, r, 2 * Math.PI, false);
            if (fillMode == "filled") ctx.fill();
            ctx.stroke();
        },

        triangle: function(centerPt, r, fillMode, rotation) {
            ctx.save();
            ctx.translate(centerPt.x, centerPt.y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0, 0 - r);
            ctx.lineTo(0 + r, 0 + r);
            ctx.lineTo(0 - r, 0 + r);
            ctx.lineTo(0, 0 - r);
            if (fillMode == "filled") ctx.fill();
            ctx.stroke();
            ctx.restore();
        },

        line: function(centerPt, r, rotation) {
            ctx.save();
            ctx.translate(centerPt.x, centerPt.y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0 - r, 0);
            ctx.lineTo(0 + r, 0);
            ctx.stroke();
            ctx.restore();
        },

        fillText: function(centerPt, r, text, rotation) {
            ctx.save();
            ctx.translate(centerPt.x, centerPt.y);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.fillText(text, 0, 0, 2 * r);
            ctx.restore();
        }
    }
};

;(function() {
    var canvas = document.getElementById("drawing")
    var drawing = Drawing(canvas);

    function mapLength(obj) {
        var size = 0;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    }

    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    var Default = {
        BACKGROUND:   "white",
        COLOR:        "black",
        SIZE:         "",
        LINE_STYLE:   "solid",
        LINE_WIDTH:   "thin",
        FILL_MODE:    "empty",
        ORIENTATION:  "horizontal"
    };

    /*
    Parse multiple rows of text.
    */
    function parse(input)  {
        var rows = input.split(/\n/);

        var layers = new Array();
        var instructions = new Array();
        var metaInstructions = {
            background: { shape: "background", color: Default.BACKGROUND },
            shapes: { shape: "shapes", color: Default.COLOR, lineStyle: Default.LINE_STYLE, lineWidth: Default.LINE_WIDTH, fillMode: Default.FILL_MODE }
        };

        rows.forEach(function(row) {
            var trimmedRow = row.trim();

            if (trimmedRow.substr(0, 1) == ';') return; // ignore comments

            if (trimmedRow.substr(0, 1) == '=') { // new layer
                layers.push(instructions);
                instructions = new Array();
                return;
            }

            var rowInstructions = parseRow(trimmedRow);

            if (rowInstructions.metaInstructions) {
                for (var key in rowInstructions.metaInstructions) {
                    metaInstructions[key] = rowInstructions.metaInstructions[key];
                }
            }

            if (rowInstructions.drawingInstructions) {
                instructions.push({ drawingInstructions: rowInstructions.drawingInstructions, metaInstructions: clone(metaInstructions) });
            }
        });

        layers.push(instructions);

        return layers;
    }

    function newProperties() {
        return {
            color:          null,
            size:           null,
            lineStyle:      null,
            lineWidth:      null,
            fillMode:       null,
            orientation:    null,
            cardinality:    1,
            borderPosition: new Array(),
            borderRatio:    null
        };
    }

    function split(line) {

        var values = new Array();

        if (line.length > 0) {
            var inQuote = null;
            var value = "";

            for (var index = 0; index < line.length; ++index) {
                var character = line.charAt(index);

                if (character == inQuote) {
                    value += character;
                    values.push(value);
                    value = "";
                    inQuote = null;
                } else if ((character == '"' || character == '\'') && !inQuote) {
                    value += character;
                    inQuote = character;
                } else if (/\s/.test(character) && !inQuote) {
                    if (value.length > 0) {
                        values.push(value);
                        value = "";
                    }
                } else {
                    value += character;
                }
            }

            values.push(value);
        }

        return values;
    }

    function appendDrawingInstruction(drawingInstructions, newDrawingInstruction, composition) {
        if (composition) {
            var lastDrawingInstruction = drawingInstructions.pop();

            if (Array.isArray(lastDrawingInstruction)) {
                lastDrawingInstruction.push(newDrawingInstruction);
                drawingInstructions.push(lastDrawingInstruction);
            } else {
                var drawingInstruction = new Array();
                drawingInstruction.push(lastDrawingInstruction);
                drawingInstruction.push(newDrawingInstruction);
                drawingInstructions.push(drawingInstruction);
            }
        }
        else
        {
            drawingInstructions.push(newDrawingInstruction);
        }
    }

    /*
    Parse a single row of text.
    Returns an array of meta instructions and an array of drawing instructions.
    */
    function parseRow(row) {
        var metaInstructions = new Object();
        var drawingInstructions = new Array();
        var properties = newProperties();

        var afterShape = false;
        var composition = false;

        var tokens = split(row);

        tokens.forEach(function(token_) {
            var token = translateSymbols(token_).toLowerCase();

            /*
            Composition
            */
            if (token == "on" && afterShape) {
                composition = true;
                return;
            }

            afterShape = false;

            /*
            Meta instructions
            */
            switch (token) {
                case "background":
                    metaInstructions[token] = { color: properties.color, shape: token };
                    properties = newProperties();
                    return;

                case "shapes":
                    metaInstructions[token] = {
                        shape:       token,
                        color:       properties.color       || Default.COLOR,
                        size:        properties.size        || Default.SIZE,
                        lineStyle:   properties.lineStyle   || Default.LINE_STYLE,
                        lineWidth:   properties.lineWidth   || Default.LINE_WIDTH,
                        fillMode:    properties.fillMode    || Default.FILL_MODE,
                        orientation: properties.orientation || Default.ORIENTATION
                    };
                    properties = newProperties();
                    return;

                case "border":
                    metaInstructions[token] = {
                        shape:          token,
                        borderPosition: properties.borderPosition || new Array(),
                        borderRatio:    properties.borderRatio    || 0
                    };
                    properties = newProperties();
                    return;
            }

            /*
            Shapes
            */
            switch (token) {
                case "blank": case "square": case "rectangle": case "circle": case "ellipse": case "triangle": case "line": case "smile":
                case "blanks": case "squares": case "rectangles": case "circles": case "ellipses": case "triangles": case "lines": case "smiles":
                    for (var i = 0; i < properties.cardinality; i++) {
                        appendDrawingInstruction(drawingInstructions, {
                            color:       properties.color,
                            size:        properties.size,
                            lineStyle:   properties.lineStyle,
                            lineWidth:   properties.lineWidth,
                            fillMode:    properties.fillMode,
                            orientation: properties.orientation,
                            shape:       token
                        }, composition);
                    };
                    properties  = newProperties();
                    afterShape  = true;
                    composition = false;
                    return;
            }

            /*
            Text label shape
            */
            if (token.search(/^".*"$/) == 0 || token.search(/^'.*'$/) == 0) {
                for (var i = 0; i < properties.cardinality; i++) {
                    appendDrawingInstruction(drawingInstructions, {
                        color:       properties.color,
                        size:        properties.size,
                        orientation: properties.orientation,
                        text:        token_.substr(1, token_.length - 2),
                        shape:       "label"
                    }, composition);
                };
                properties  = newProperties();
                afterShape  = true;
                composition = false;
                return;
            }

            /*
            Properties
            */
            switch (token) {
                case "aqua": case "black": case "blue": case "fuchsia": case "gray": case "green": case "lime":  case "maroon": case "navy":
                case "olive": case "orange": case "purple": case "red": case "silver": case "teal": case "white": case "yellow":
                    properties.color = token;
                    return;

                case "tiny": case "small": case "big": case "huge":
                    properties.size = token;
                    return;

                case "dashed": case "dotted": case "solid":
                    properties.lineStyle = token;
                    return;

                case "fat": case "thick": case "thin":
                    properties.lineWidth = token;
                    return;

                case "filled": case "empty":
                    properties.fillMode = token;
                    return;

                case "horizontal": case "vertical":
                    properties.orientation = token;
                    return;

                case "left": case "right": case "top": case "bottom":
                    properties.borderPosition.push(token);
                    return;
            }

            if (!isNaN(token)) {
                properties.cardinality = parseInt(token);
                return;
            }

            var ratioMatch = /(\d+)\/(\d+)/.exec(token);
            if (ratioMatch) {
                var num = parseInt(ratioMatch[1]);
                var den = parseInt(ratioMatch[2]);

                if (den > 0) {
                    properties.borderRatio = num / den;
                }
            }
        });

        return {
            metaInstructions : mapLength(metaInstructions) > 0 ? metaInstructions : null,
            drawingInstructions: drawingInstructions.length > 0 ? drawingInstructions : null
        };
    }

    function translateSymbols(token) {
        switch (token) {
            case "_": return "blank";
            case "#": return "square";
            case "o": return "circle";
            case "[]": return "rectangle";
            case "()": return "ellipse";
            case "/\\": return "triangle";
            case "-": return "line";
            default: return token;
        }
    }

    function renderLayers(layers) {
        drawing.clear();
        resetCanvas();

        var firstLayer = true;
        layers.forEach(function(instructions) {
            render(instructions, firstLayer);
            firstLayer = false;
        });
    }

    /*
    Render multiple rows of instructions.
    Accepts an array of arrays of instructions.
    */
    function render(instructions, renderBackground) {
        var rowCount = instructions.length;

        var currentRow = 0;
        if (renderBackground) {
            instructions.forEach(function(rowInstructions) {
                renderRowBackground(rowInstructions, currentRow, rowCount);
                currentRow++;
            });
        }

        currentRow = 0;
        instructions.forEach(function(rowInstructions) {
            renderRow(rowInstructions, currentRow, rowCount);
            currentRow++;
        });
    }

    function renderRowBackground(rowInstructions, currentRow, rowCount) {
        var columnCount = rowInstructions.drawingInstructions.length;

        for (var key in rowInstructions.metaInstructions) {
            renderBackgroundInstruction(rowInstructions.metaInstructions[key], currentRow, 0, rowCount, columnCount);
        }
    }

    /*
    Render a single row of instructions.
    Accepts an array of instructions.
    */
    function renderRow(rowInstructions, currentRow, rowCount) {
        var columnCount = rowInstructions.drawingInstructions.length;

        for (var key in rowInstructions.metaInstructions) {
            renderMetaInstruction(rowInstructions.metaInstructions[key], currentRow, 0, rowCount, columnCount);
        }

        var currentColumn = 0;
        rowInstructions.drawingInstructions.forEach(function(instruction) {
            if (Array.isArray(instruction)) {
                instruction.reverse().forEach(function(instr) {
                    renderInstruction(instr, currentRow, currentColumn, rowCount, columnCount);
                })
            } else {
                renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount);
            }

            currentColumn++;
        });
    }

    /*
    Calculate the center of a shape
    */
    function calcCenter(rect, currentRow, currentColumn, rowCount, columnCount) {
        var cellWidth = (rect.right - rect.left) / columnCount;
        var cellHeight = (rect.bottom - rect.top) / rowCount;

        return {
            x: rect.left + (currentColumn * cellWidth + cellWidth / 2),
            y: rect.top + (currentRow * cellHeight + cellHeight / 2)
        };
    }

    function factor(size) {
        switch (size) {
            case "huge":
                return 1.0;

            case "big":
                return 0.85;

            case "small":
                return 0.5;

            case "tiny":
                return 0.25;

            default:
                return 0.75;
        }
    }

    /*
    Calculate a shapes radius
    */
    function calcRadius(canvasSize, count, size) {

        return canvasSize / count / 2 * factor(size);
    }

    function calcHalfRect(rect, columnCount, rowCount, size, orientation) {
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;

        if (orientation == "vertical") {
            var w = calcRadius(height, rowCount, size);
            var h = calcRadius(width, columnCount, size);
        } else {
            var w = calcRadius(width, columnCount, size);
            var h = calcRadius(height, rowCount, size);
        }

        if (w >= h) {
            return { halfWidth: w, halfHeight: h * 0.8 };
        } else {
            return { halfWidth: w, halfHeight: w * 0.8 };
        }
    }

    function calcFontSize(rect, rowCount, columnCount, size) {
        return Math.min((rect.right - rect.left) / columnCount / 2, (rect.bottom - rect.top) / rowCount / 2) * factor(size);
    }

    function calcLineWidth(lineWidth) {
        switch (lineWidth) {
            case "thin":
                return 1;
            case "thick":
                return 4;
            case "fat":
                return 8;
        }
    }

    function setLineStyle(lineStyle, lineWidth) {
        var w = calcLineWidth(lineWidth);

        switch (lineStyle) {
            case "dashed":
                drawing.setLineDash([3 * w]);
                break;
            case "dotted":
                drawing.setLineDash([w, w]);
                break;
            case "solid":
                drawing.setLineDash([]);
                break;
        }
    }

    function setLineWidth(lineWidth) {
        drawing.setLineWidth(calcLineWidth(lineWidth));
    }

    function renderBackgroundInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        switch (instruction.shape) {
            case "background":
                drawing.setFillStyle(instruction.color);
                drawing.fillRectangle({
                    x: canvas.width / 2,
                    y: (canvas.height * currentRow / rowCount) + (canvas.height / rowCount / 2)
                },
                canvas.width / 2,
                (canvas.height / rowCount / 2));
                break;
        }
    }

    function renderMetaInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        switch (instruction.shape) {
            case "shapes":
                canvas.defaultColor       = instruction.color;
                canvas.defaultSize        = instruction.size;
                canvas.defaultLineStyle   = instruction.lineStyle;
                canvas.defaultLineWidth   = instruction.lineWidth;
                canvas.defaultFillMode    = instruction.fillMode;
                canvas.defaultOrientation = instruction.orientation;
                return;

            case "border":
                canvas.borderPosition = instruction.borderPosition;
                canvas.borderRatio    = instruction.borderRatio;
            return;
        }
    }

    function resetCanvas() {
        delete canvas.borderPosition;
        delete canvas.borderRatio;
    }

    function calcCanvasRect(canvas) {
        var bp = canvas

        if (!canvas.borderPosition || !canvas.borderRatio) {
            return { left: 0, top: 0, right: canvas.width, bottom: canvas.height };
        } else if (canvas.borderPosition.length == 0) {
            var br = canvas.borderRatio;

            return {
                left:   br * canvas.width,
                top:    br * canvas.height,
                right:  canvas.width - br * canvas.width,
                bottom: canvas.height - br * canvas.height
            };
        } else {
            var bp = canvas.borderPosition;
            var br = canvas.borderRatio;

            return {
                left:   bp.indexOf("left")   >= 0 ? (br * canvas.width) : 0,
                top:    bp.indexOf("top")    >= 0 ? (br * canvas.height) : 0,
                right:  bp.indexOf("right")  >= 0 ? (canvas.width - br * canvas.width) : canvas.width,
                bottom: bp.indexOf("bottom") >= 0 ? (canvas.height - br * canvas.height) : canvas.height
            };
        }
    }

    /*
    Render a single instruction.
    */
    function renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        drawing.setFillStyle(instruction.color || canvas.defaultColor);
        drawing.setStrokeStyle(instruction.color || canvas.defaultColor);
        setLineStyle(instruction.lineStyle || canvas.defaultLineStyle, instruction.lineWidth || canvas.defaultLineWidth);
        setLineWidth(instruction.lineWidth || canvas.defaultLineWidth);

        var rect = calcCanvasRect(canvas);
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;

        switch (instruction.shape) {
            case "square":
            case "squares":
                drawing.square(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount),
                    Math.min(calcRadius(width, columnCount, instruction.size || canvas.defaultSize), calcRadius(height, rowCount, instruction.size || canvas.defaultSize)),
                    instruction.fillMode || canvas.defaultFillMode);
                break;

            case "rectangle":
            case "rectangles":
                var halfRect = calcHalfRect(rect, columnCount, rowCount, instruction.size || canvas.defaultSize, instruction.orientation || canvas.defaultOrientation);
                drawing.rectangle(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount), halfRect.halfWidth, halfRect.halfHeight,
                    instruction.fillMode || canvas.defaultFillMode, (instruction.orientation || canvas.defaultOrientation) == "vertical" ? -90 : 0);
                break;

            case "circle":
            case "circles":
                drawing.circle(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount),
                    Math.min(calcRadius(width, columnCount, instruction.size || canvas.defaultSize), calcRadius(height, rowCount, instruction.size || canvas.defaultSize)),
                    instruction.fillMode || canvas.defaultFillMode);
                break;

            case "ellipse":
            case "ellipses":
                var halfRect = calcHalfRect(rect, columnCount, rowCount, instruction.size || canvas.defaultSize, instruction.orientation || canvas.defaultOrientation);
                drawing.ellipse(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount), halfRect.halfWidth, halfRect.halfHeight,
                    instruction.fillMode || canvas.defaultFillMode, (instruction.orientation || canvas.defaultOrientation) == "vertical" ? -90 : 0);
                break;

            case "smile":
            case "smiles":
                var halfRect = calcHalfRect(rect, columnCount, rowCount, instruction.size || canvas.defaultSize, instruction.orientation || canvas.defaultOrientation);
                drawing.smile(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount), halfRect.halfWidth, halfRect.halfHeight,
                    instruction.fillMode || canvas.defaultFillMode, (instruction.orientation || canvas.defaultOrientation) == "vertical" ? -90 : 0);
                break;

            case "triangle":
            case "triangles":
                drawing.triangle(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount),
                    Math.min(calcRadius(width, columnCount, instruction.size || canvas.defaultSize), calcRadius(height, rowCount, instruction.size || canvas.defaultSize)),
                    instruction.fillMode || canvas.defaultFillMode, (instruction.orientation || canvas.defaultOrientation) == "vertical" ? -90 : 0);
                break;

            case "line":
            case "lines":
                drawing.line(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount),
                    calcRadius(width, columnCount, instruction.size || canvas.defaultSize), (instruction.orientation || canvas.defaultOrientation) == "vertical" ? -90 : 0);
                break;

            case "label":
                drawing.setFont(calcFontSize(rect, rowCount, columnCount, instruction.size) + "pt Arial");
                drawing.fillText(calcCenter(rect, currentRow, currentColumn, rowCount, columnCount),
                    Math.min(calcRadius(width, columnCount, instruction.size || canvas.defaultSize), calcRadius(height, rowCount, instruction.size || canvas.defaultSize)),
                    instruction.text, (instruction.orientation || canvas.defaultOrientation) == "vertical" ? -90 : 0);
                break;
        }
    }

    window.onload = function() {
        var input = document.getElementById("input");

        var draw = function() {
            var layers = parse(input.value);
            renderLayers(layers);

            window.requestAnimationFrame(draw);
        };

        window.requestAnimationFrame(draw);
    };
})();
