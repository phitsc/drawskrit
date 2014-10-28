
Drawing = {
    fillRectangle: function(ctx, x, y, w, h) {
        ctx.fillRect(x, y, w, h);
    },

    fillCircle: function(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }
};

;(function() {
    var canvas = document.getElementById("drawing")
    var drawing = canvas.getContext('2d');

    function parse(input)  {
        var lines = input.split(/\n/);

        var instructions = new Array();

        lines.forEach(function(line) {
            var perLineInstructions = parseLine(line);

            if (perLineInstructions) {
                instructions.push(perLineInstructions);
            }
        });

        if (instructions.length > 0) {
            console.log(instructions);
        }

        return instructions;
    }

    function parseLine(line) {
        var tokens = line.split(/\s+/);

        var instructions = new Array();

        var label = null;
        var amount = null;
        var color = null;
        var size = null; 

        tokens.forEach(function(token) {
            switch (token) {
                case "square": case "circle":
                    instructions.push({ label: label, amount: amount, color: color, size: size, shape: token});
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
        });

        return instructions.length > 0 ? instructions : null;
    }

    function render(instructions) {
        drawing.clearRect(0, 0, canvas.width, canvas.height);
        drawing.fillStyle = "GhostWhite";
        drawing.fillRect(0, 0, canvas.width, canvas.height);

        var lines = instructions.length;
        var maxShapeHeight = canvas.height / lines;

        var line = 0;
        instructions.forEach(function(lineInstruction) {
            renderLine(lineInstruction, line, maxShapeHeight);
            line++;
        });
    }

    function renderLine(lineInstructions, line, maxShapeHeight) {
        var columns = lineInstructions.length;

        var maxShapeWidth = canvas.width / columns;

        var column = 0;
        lineInstructions.forEach(function(instruction) {
            renderInstruction(instruction, line, column, maxShapeHeight, maxShapeWidth);
            column++;
        });

    }

    function renderInstruction(instruction, line, column, maxShapeHeight, maxShapeWidth) {
        drawing.fillStyle = instruction.color ? instruction.color.trim() : "black";

        switch (instruction.shape) {
            case "square":
                Drawing.fillRectangle(drawing, column * maxShapeWidth, line * maxShapeHeight, maxShapeHeight, maxShapeHeight);
                break;

            case "circle":
                Drawing.fillCircle(drawing, canvas.width / 2, line * maxShapeHeight +  maxShapeHeight / 2, maxShapeHeight / 2);
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