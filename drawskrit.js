
Drawing = {
    fillRectangle: function(ctx, rect) {
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    },

    fillSquare: function(ctx, centerPt, r) {
        ctx.fillRect(centerPt.x - r, centerPt.y - r, 2 * r, 2 * r);
    },

    fillCircle: function(ctx, centerPt, r) {
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y, r, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
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

        var label = null;
        var amount = null;
        var color = null;
        var size = null; 

        tokens.forEach(function(token) {
            switch (token) {
                case "background": case "border":
                    metaInstructions.push({ color: color, shape: token});
                    label = amount = color = size = null;
                    return;

                case "square": case "rectangle": case "circle":
                case "squares": case "rectangles": case "circles":
                    drawingInstructions.push({ label: label, amount: amount, color: color, size: size, shape: token});
                    label = amount = color = size = null;
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

            if (!isNaN(token)) {
                amount = parseInt(token);
                return;
            }
        });

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

    function calcRect(currentRow, currentColumn, rowCount, columnCount) {
        var cellWidth = canvas.width / columnCount;
        var cellHeight = canvas.height / rowCount;

        return { 
            x: currentColumn * cellWidth,
            y: currentRow * cellHeight,
            w: cellWidth,
            h: cellHeight
        }
    }

    /*
    Render a single instruction.
    */
    function renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        drawing.fillStyle = drawing.strokeStyle = instruction.color ? instruction.color.trim() : "black";

        console.log(instruction.size)

        switch (instruction.shape) {
            case "background":
                Drawing.fillRectangle(drawing, { x: 0, y: 0, w: canvas.width, h: canvas.height });
                break;

            case "square":
            case "squares":
                Drawing.fillSquare(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), calcRadius(rowCount, columnCount, instruction.size));
                break;

            case "rectangle":
            case "rectangles":
                Drawing.fillRectangle(drawing, calcRect(currentRow, currentColumn, rowCount, columnCount));
                break;

            case "circle":
            case "circles":
                Drawing.fillCircle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), calcRadius(rowCount, columnCount, instruction.size));
                break;
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