// ### constants ###

const Difficulty = {
    Introduce: 0,
    Easy: 1,
    Medium: 2,
    Hard: 3
}

const GameType = {
    Pair: 1,
    Sequence: 2,
    Picture: 0,
    Nothing: -1
}

const GameState = {
    Start: 0,
    Intro: 1,
    Running: 2,
    Solution: 3,
    Help: 4,
    Pause: 5
}

// ### some declaration ###

// holds the stone position
var stonePos = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
];

// holds the field position
var fieldPos = [
    [490, 90],
    [655, 250],
    [650, 500],
    [490, 650],
    [240, 650],
    [75, 500],
    [70, 250],
    [225, 90]
];