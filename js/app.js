var chess = new Chess();
var currentColor = chess.turn();
var turn = 0;
var timeOut = null;
var photon = document.getElementsByClassName("photon-shader");
var sphere = document.getElementsByClassName("sphere");
var piece = document.getElementsByClassName("piece");
var square = document.getElementsByClassName("square");
var app = document.getElementById("app");
var scene = document.getElementById("scene");
var sceneX = 70;
var sceneY = 90;
var controls = false;
var animated = false;
var mouseDown = false;
var closestElement = null;
var white = "White";
var black = "Black";

function checkTouch() {
  var d = document.createElement("div");
  d.setAttribute("ontouchmove", "return;");
  return typeof d.ontouchmove === "function" ? true : false;
}

if(checkTouch()) {
  var press = "touchstart";
  var drag = "touchmove";
  var drop = "touchend";
} else {
  var press = "mousedown";
  var drag = "mousemove";
  var drop = "mouseup";
}

function initControls() {
  for(var i=0; i<piece.length; i++) { 
    piece[i].addEventListener(press, grabPiece, false);
  }
  app.addEventListener(drag, dragPiece, false);
  app.addEventListener(drop, dropPiece, false);
  app.addEventListener(drag, moveScene, false);
  app.onselectstart = function(event) { event.preventDefault(); }
  app.ontouchmove = function(event) { event.preventDefault(); }
}

function grabPiece(event) {
  if (!mouseDown && controls) {
    event.preventDefault();
    mouseDown = true;
    grabbed = this;
    grabbedID = grabbed.id.substr(-2);
    startX = event.pageX - (document.body.offsetWidth/2);
    startY = event.pageY - (document.body.offsetHeight/2);
    style = window.getComputedStyle(grabbed);
    matrix = style.getPropertyValue('-webkit-transform');
    matrixParts = matrix.split(",");
    grabbedW = parseInt(style.getPropertyValue('width'))/2;
    grabbedX = parseInt(matrixParts[4]);
    grabbedY = parseInt(matrixParts[5]);
    grabbed.classList.add("grabbed");
    showMoves(grabbedID);
    highLight(grabbed, square);
  }
}

function dragPiece(event) {
  if (mouseDown && controls) {
    event.preventDefault();
    moveX = event.pageX - (document.body.offsetWidth/2);
    moveY = event.pageY - (document.body.offsetHeight/2);
    distX = moveX-startX;
    distY = moveY-startY;
    if (currentColor === "w") {
      newX  = grabbedX+distX;
      newY  = grabbedY+distY;
    } else {
      newX  = -(grabbedX+distX);
      newY  = -(grabbedY+distY);
    }
    grabbed.style.webkitTransform = "translateX(" + newX + "px) translateY(" + newY + "px) translateZ(2px)";
    highLight(grabbed, square);
  }
}

function dropPiece(event) {
  if (mouseDown && controls) {
    event.preventDefault();
    var squareEndPos = closestElement.id;
    function getMove(moveType) {
      return document.getElementById(squareEndPos).className.match(new RegExp('(\\s|^)'+moveType+'(\\s|$)'));
    }
    if ( getMove("valid") ) {
      if ( getMove("captured") ) {
        var type = chess.get(squareEndPos).type;
        var color = chess.get(squareEndPos).color;
        if (currentColor === "w") {
          createPiece(color, type, "w-jail");
        } else {
          createPiece(color, type, "b-jail");
        }
      }
      hideMoves(grabbedID);
      chess.move({ from: grabbedID, to: squareEndPos, promotion: 'q' });
    } else {
      hideMoves(grabbedID);
      grabbed.style.webkitTransform = "translateX(0px) translateY(0px) translateZ(2px)";
    }
    updateBoard();
    grabbed.classList.remove("grabbed");
    mouseDown = false;
  }
}

function moveScene(event) {
  if (animated) {
    eventStartX = event.pageX - (document.body.offsetWidth/2);
    eventStartY = event.pageY - (document.body.offsetHeight/2);
  }
  eventStartX = 0;
  eventStartY = 0;
  if (!controls && !animated) {
    document.body.classList.remove("animated");
    event.preventDefault();
    eventMoveX = event.pageX - (document.body.offsetWidth/2);
    eventDistX = (eventMoveX - eventStartX);
    eventMoveY = event.pageY - (document.body.offsetHeight/2);
    eventDistY = (eventMoveY - eventStartY);
    eventX = sceneY - (eventDistX*-.03);
    eventY = sceneX - (eventDistY*-.03);
    scene.style.webkitTransform = 'RotateX('+ eventY + 'deg) RotateZ('+ eventX + 'deg)';
    for(var i=0; i<sphere.length; i++) {
      updateSphere(sphere[i],eventY,eventX);
    }
  }
}

function showMoves(Target) {
  var validMoves = chess.moves({ target: Target, verbose: true });
  for(var i=0; i<validMoves.length; i++) {
    var validMove = validMoves[i];
    var from = validMove.from;
    var to = validMove.to;
    var captured = validMove.captured;
    document.getElementById(from).classList.add("current");
    document.getElementById(to).classList.add("valid");
    if (captured) { document.getElementById(to).classList.add("captured"); }
  }
}

function hideMoves(Target) {
  var validMoves = chess.moves({ target: Target, verbose: true });
  for(var i=0; i<validMoves.length; i++) {
    var validMove = validMoves[i];
    var from = validMove.from;
    var to = validMove.to;
    document.getElementById(from).classList.remove("current");
    document.getElementById(to).classList.remove("valid");
    document.getElementById(to).classList.remove("captured");
  }
}

function createPiece(color, piece, position) {
  var clone = document.getElementById(piece).cloneNode(true);
  clone.addEventListener(press, grabPiece, false);
  clone.setAttribute("id",color+piece+position);
  if ( color === "w" ) { clone.classList.add("white"); } 
  else { clone.classList.add("black"); }
  document.getElementById(position).appendChild(clone);
}

function updateBoard() {
  var updateTiles = {};
  var inCheck = chess.in_check();
  var inCheckmate = chess.in_checkmate();
  var inDraw = chess.in_draw();
  var inStalemate = chess.in_stalemate();
  var inThreefold = chess.in_threefold_repetition();
  chess.SQUARES.forEach(function(tile) {
    var boardS = board[tile];
    var chessS = chess.get(tile);
    if (boardS && chessS) {
      if (boardS.type !== chessS.type || boardS.color !== chessS.color) {
        updateTiles[tile] = chessS;   
      }
    } else if (boardS || chessS) {
      updateTiles[tile] = chessS;
    }
    board[tile] = chessS;
  });
  for (var id in updateTiles) {
    var titleID = document.getElementById([id]);
    if (updateTiles[id] === null) {
      titleID.innerHTML = "";
    } else {
      var color = updateTiles[id].color;
      var piece = updateTiles[id].type;
      var symbol = color + piece;
      if ( currentColor === color && !titleID.hasChildNodes()) {
        createPiece(color, piece, [id]);
      } else {
        titleID.innerHTML = "";
        createPiece(color, piece, [id]);
      }
    }
  }
  var fen = chess.fen();
  currentColor = chess.turn();
  function Log(message) {
    document.getElementById("log").innerHTML = message;
  }
  if (fen !== "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
    document.getElementById("undo").dataset.state="active";
  } else {
    document.getElementById("undo").dataset.state="inactive";
  }
  if (currentColor === "w") {
    updateView(0,0);
    Log(white+"'s turn");
    if (inCheck) { 
      Log(white+"'s king is in check !");
    }
    if (inCheckmate) { 
      Log(white+"'s king is in checkmate ! "+black+" wins !");
    }
  } else {
    updateView(0,180);
    Log(black+"'s turn");
    if (inCheck) { 
      Log(black+"'s king is in check !");
    }
    if (inCheckmate) { 
      Log(black+"'s king is in checkmate ! "+white+" wins");
    }
  }
}

function updateCaptured() {
  var wbPiece  = document.getElementById("board").getElementsByClassName("white");
  var bbPiece  = document.getElementById("board").getElementsByClassName("black");
  var wjPiece  = document.getElementById("w-jail").getElementsByClassName("black");
  var bjPiece  = document.getElementById("b-jail").getElementsByClassName("white");
  if (wbPiece.length+bjPiece.length !== 16) {
    var child = document.getElementById("b-jail").lastChild;
    document.getElementById("b-jail").removeChild(child);
  }
  if (bbPiece.length+wjPiece.length !== 16) {
    var child = document.getElementById("w-jail").lastChild;
    document.getElementById("w-jail").removeChild(child);
  }
}

function undoMove() {
  chess.undo();
  updateBoard();
  updateCaptured();
}

function highLight(element, square) {

  function winPos(obj) {
    var box = obj.getBoundingClientRect();
    return {
      x : box.left,
      y : box.top
    }
  }

  var elementLeft = winPos(element).x + grabbedW;
      elementRight = elementLeft + element.offsetWidth - grabbedW,
      elementTop = winPos(element).y + grabbedW,
      elementBottom = elementTop + element.offsetHeight - grabbedW,
      smallestDistance = null;

  for(var i = 0; i < square.length; i++) {


    if (currentColor === "w") {
    var squareLeft = winPos(square[i]).x,
        squareRight = squareLeft + square[i].offsetWidth,
        squareTop = winPos(square[i]).y,
        squareBottom = squareTop + square[i].offsetHeight;
    } else {
    var squareLeft = winPos(square[i]).x + grabbedW,
        squareRight = squareLeft + square[i].offsetWidth,
        squareTop = winPos(square[i]).y + grabbedW,
        squareBottom = squareTop + square[i].offsetHeight;
    }

    var xPosition = 0,
        yPosition = 0;

    if(squareRight < elementLeft) {
      xPosition = elementLeft - squareRight;
    } else if(squareLeft > elementRight) {
      xPosition = squareLeft - elementRight;
    }
    if(squareBottom < elementTop) {
      yPosition = elementTop - squareBottom;
    } else if(squareTop > elementBottom) {
      yPosition = squareTop - elementBottom;
    }
    var valueForComparison = 0;
    if(xPosition > yPosition) {
      valueForComparison = xPosition;
    } else {
      valueForComparison = yPosition;
    }
    if(smallestDistance === null) {
      smallestDistance = valueForComparison;
      closestElement = square[i];
    } else if(valueForComparison < smallestDistance) {
      smallestDistance = valueForComparison;
      closestElement = square[i];
    }
  }

  for(var i = 0; i < square.length; i++) {
    square[i].classList.remove("highlight");
  }

  closestElement.classList.add("highlight");
  targetX = closestElement.offsetLeft;
  targetY = closestElement.offsetTop;

}

function updateView(sceneXAngle,sceneZAngle) {
  scene.style.webkitTransform = "rotateX( " + sceneXAngle + "deg) rotateZ( " + sceneZAngle + "deg)";
  for(var i=0; i<sphere.length; i++) {
    updateSphere(sphere[i],sceneXAngle,sceneZAngle);
  }
}

function updateSphere(sphere,sceneXAngle,sceneZAngle) {
  sphere.style.WebkitTransform = "rotateZ( " + ( - sceneZAngle ) + "deg ) rotateX( " + ( - sceneXAngle ) + "deg )";
}

function renderPoly() {
  var light = new Photon.Light( x = 50, y = 150, z = 250);
  var shadeAmount = 1;
  var tintAmount = 1;
  var pieces = new Photon.FaceGroup($("#container")[0], $("#container .face"), 1.6, .48, true);
  pieces.render(light, true);
}

function resetPoly() {
  for(var i = 0; i < photon.length; i++) {
    photon[i].setAttribute("style","");
  }
  if(timeOut != null) clearTimeout(timeOut);
  timeOut = setTimeout(renderPoly, 250);
}

function Continue() {
  updateBoard();
  controls = true;
  animated = true;
  document.getElementById("app").dataset.state="game";
  document.body.classList.add("animated");
}

function optionScreen() {
  updateView(sceneX,sceneY);
  controls = false;
  document.getElementById("app").dataset.state="menu";
  function setAnimated() { animated = false; }
  setTimeout(setAnimated, 2500);
}

function toggleFrame(event) {
  if (event.checked) {
    document.getElementById("app").dataset.frame="on";
  } else {
    document.getElementById("app").dataset.frame="off";
  }
  resetPoly();
}

function setState(event) {
  event.preventDefault();
  var data = this.dataset.menu;
  document.getElementById("app").dataset.menu=data;
}

function setTheme(event) {
  event.preventDefault();
  var data = this.dataset.theme;
  document.getElementById("app").dataset.theme=data;
  if (data === "classic" || data === "marble" ) { white = "White", black = "Black" }
  else if (data === "flat" || data === "wireframe" ) { white = "Blue", black = "Red" }
}

function UI() {
  var menuBtns = document.getElementsByClassName("menu-nav");
  var themeBtns = document.getElementsByClassName("set-theme");
  for(var i=0; i<menuBtns.length; i++) {
    menuBtns[i].addEventListener(press, setState, false);
  }
  for(var i=0; i<themeBtns.length; i++) {
    themeBtns[i].addEventListener(press, setTheme, false);
  }
  document.getElementById("continue").addEventListener(press, Continue, false);
  document.getElementById("open-menu").addEventListener(press, optionScreen, false);
  document.getElementById("undo").addEventListener(press, undoMove, false);
}

function init() {
  app.classList.remove("loading");
  document.body.classList.add("animated");
  animated = true;
  updateBoard();
  optionScreen();
  initControls();
  UI();
  function anime() { document.getElementById("logo").innerHTML = ""; }
  setTimeout(anime, 2000);
}

window.addEventListener("resize", resetPoly, false);

var readyStateCheckInterval = setInterval(function() {
  if (document.readyState === "complete") {
    renderPoly();
    init();
    clearInterval(readyStateCheckInterval);
  }
}, 3250);

var STACK_SIZE = 100; // maximum size of undo stack

var board = null;
var $board = $('#myBoard');
var game = new Chess();
var globalSum = 0; // always from black's perspective. Negative for white's perspective.
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

var squareClass = 'square-55d63';
var squareToHighlight = null;
var colorToHighlight = null;
var positionCount;

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
};
board = Chessboard('myBoard', config);

timer = null;

/*
 * Piece Square Tables, adapted from Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */

var weights = { p: 100, n: 280, b: 320, r: 479, q: 929, k: 60000, k_e: 60000 };
var pst_w = {
  p: [
    [100, 100, 100, 100, 105, 100, 100, 100],
    [78, 83, 86, 73, 102, 82, 85, 90],
    [7, 29, 21, 44, 40, 31, 44, 7],
    [-17, 16, -2, 15, 14, 0, 15, -13],
    [-26, 3, 10, 9, 6, 1, 0, -23],
    [-22, 9, 5, -11, -10, -2, 3, -19],
    [-31, 8, -7, -37, -36, -14, 3, -31],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-66, -53, -75, -75, -10, -55, -58, -70],
    [-3, -6, 100, -36, 4, 62, -4, -14],
    [10, 67, 1, 74, 73, 27, 62, -2],
    [24, 24, 45, 37, 33, 41, 25, 17],
    [-1, 5, 31, 21, 22, 35, 2, 0],
    [-18, 10, 13, 22, 18, 15, 11, -14],
    [-23, -15, 2, 0, 2, 0, -23, -20],
    [-74, -23, -26, -24, -19, -35, -22, -69],
  ],
  b: [
    [-59, -78, -82, -76, -23, -107, -37, -50],
    [-11, 20, 35, -42, -39, 31, 2, -22],
    [-9, 39, -32, 41, 52, -10, 28, -14],
    [25, 17, 20, 34, 26, 25, 15, 10],
    [13, 10, 17, 23, 17, 16, 0, 7],
    [14, 25, 24, 15, 8, 25, 20, 15],
    [19, 20, 11, 6, 7, 6, 20, 16],
    [-7, 2, -15, -12, -14, -15, -10, -10],
  ],
  r: [
    [35, 29, 33, 4, 37, 33, 56, 50],
    [55, 29, 56, 67, 55, 62, 34, 60],
    [19, 35, 28, 33, 45, 27, 25, 15],
    [0, 5, 16, 13, 18, -4, -9, -6],
    [-28, -35, -16, -21, -13, -29, -46, -30],
    [-42, -28, -42, -25, -25, -35, -26, -46],
    [-53, -38, -31, -26, -29, -43, -44, -53],
    [-30, -24, -18, 5, -2, -18, -31, -32],
  ],
  q: [
    [6, 1, -8, -104, 69, 24, 88, 26],
    [14, 32, 60, -10, 20, 76, 57, 24],
    [-2, 43, 32, 60, 72, 63, 43, 2],
    [1, -16, 22, 17, 25, 20, -13, -6],
    [-14, -15, -2, -5, -1, -10, -20, -22],
    [-30, -6, -13, -11, -16, -11, -16, -27],
    [-36, -18, 0, -19, -15, -15, -21, -38],
    [-39, -30, -31, -13, -31, -36, -34, -42],
  ],
  k: [
    [4, 54, 47, -99, -99, 60, 83, -62],
    [-32, 10, 55, 56, 56, 55, 10, 3],
    [-62, 12, -57, 44, -67, 28, 37, -31],
    [-55, 50, 11, -4, -19, 13, 0, -49],
    [-55, -43, -52, -28, -51, -47, -8, -50],
    [-47, -42, -43, -79, -64, -32, -29, -32],
    [-4, 3, -14, -50, -57, -18, 13, 4],
    [17, 30, -3, -14, 6, -1, 40, 18],
  ],

  // Endgame King Table
  k_e: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ],
};
var pst_b = {
  p: pst_w['p'].slice().reverse(),
  n: pst_w['n'].slice().reverse(),
  b: pst_w['b'].slice().reverse(),
  r: pst_w['r'].slice().reverse(),
  q: pst_w['q'].slice().reverse(),
  k: pst_w['k'].slice().reverse(),
  k_e: pst_w['k_e'].slice().reverse(),
};

var pstOpponent = { w: pst_b, b: pst_w };
var pstSelf = { w: pst_w, b: pst_b };

/*
 * Evaluates the board at this point in time,
 * using the material weights and piece square tables.
 */
function evaluateBoard(game, move, prevSum, color) {

  if (game.in_checkmate()) {

    // Opponent is in checkmate (good for us)
    if (move.color === color) {
      return 10 ** 10;
    }
    // Our king's in checkmate (bad for us)
    else {
      return -(10 ** 10);
    }
  }

  if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate())
  {
    return 0;
  }

  if (game.in_check()) {
    // Opponent is in check (good for us)
    if (move.color === color) {
      prevSum += 50;
    }
    // Our king's in check (bad for us)
    else {
      prevSum -= 50;
    }
  }

  var from = [
    8 - parseInt(move.from[1]),
    move.from.charCodeAt(0) - 'a'.charCodeAt(0),
  ];
  var to = [
    8 - parseInt(move.to[1]),
    move.to.charCodeAt(0) - 'a'.charCodeAt(0),
  ];

  // Change endgame behavior for kings
  if (prevSum < -1500) {
    if (move.piece === 'k') {
      move.piece = 'k_e';
    }
    // Kings can never be captured
    // else if (move.captured === 'k') {
    //   move.captured = 'k_e';
    // }
  }

  if ('captured' in move) {
    // Opponent piece was captured (good for us)
    if (move.color === color) {
      prevSum +=
        weights[move.captured] +
        pstOpponent[move.color][move.captured][to[0]][to[1]];
    }
    // Our piece was captured (bad for us)
    else {
      prevSum -=
        weights[move.captured] +
        pstSelf[move.color][move.captured][to[0]][to[1]];
    }
  }

  if (move.flags.includes('p')) {
    // NOTE: promote to queen for simplicity
    move.promotion = 'q';

    // Our piece was promoted (good for us)
    if (move.color === color) {
      prevSum -=
        weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum +=
        weights[move.promotion] +
        pstSelf[move.color][move.promotion][to[0]][to[1]];
    }
    // Opponent piece was promoted (bad for us)
    else {
      prevSum +=
        weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum -=
        weights[move.promotion] +
        pstSelf[move.color][move.promotion][to[0]][to[1]];
    }
  } else {
    // The moved piece still exists on the updated board, so we only need to update the position value
    if (move.color !== color) {
      prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
    } else {
      prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
    }
  }

  return prevSum;
}

/*
 * Performs the minimax algorithm to choose the best move: https://en.wikipedia.org/wiki/Minimax (pseudocode provided)
 * Recursively explores all possible moves up to a given depth, and evaluates the game board at the leaves.
 *
 * Basic idea: maximize the minimum value of the position resulting from the opponent's possible following moves.
 * Optimization: alpha-beta pruning: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning (pseudocode provided)
 *
 * Inputs:
 *  - game:                 the game object.
 *  - depth:                the depth of the recursive tree of all possible moves (i.e. height limit).
 *  - isMaximizingPlayer:   true if the current layer is maximizing, false otherwise.
 *  - sum:                  the sum (evaluation) so far at the current layer.
 *  - color:                the color of the current player.
 *
 * Output:
 *  the best move at the root of the current subtree.
 */
function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color) {
  positionCount++;
  var children = game.ugly_moves({ verbose: true });

  // Sort moves randomly, so the same move isn't always picked on ties
  children.sort(function (a, b) {
    return 0.5 - Math.random();
  });

  var currMove;
  // Maximum depth exceeded or node is a terminal node (no children)
  if (depth === 0 || children.length === 0) {
    return [null, sum];
  }

  // Find maximum/minimum from list of 'children' (possible moves)
  var maxValue = Number.NEGATIVE_INFINITY;
  var minValue = Number.POSITIVE_INFINITY;
  var bestMove;
  for (var i = 0; i < children.length; i++) {
    currMove = children[i];

    // Note: in our case, the 'children' are simply modified game states
    var currPrettyMove = game.ugly_move(currMove);
    var newSum = evaluateBoard(game, currPrettyMove, sum, color);
    var [childBestMove, childValue] = minimax(
      game,
      depth - 1,
      alpha,
      beta,
      !isMaximizingPlayer,
      newSum,
      color
    );

    game.undo();

    if (isMaximizingPlayer) {
      if (childValue > maxValue) {
        maxValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue > alpha) {
        alpha = childValue;
      }
    } else {
      if (childValue < minValue) {
        minValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue < beta) {
        beta = childValue;
      }
    }

    // Alpha-beta pruning
    if (alpha >= beta) {
      break;
    }
  }

  if (isMaximizingPlayer) {
    return [bestMove, maxValue];
  } else {
    return [bestMove, minValue];
  }
}

function checkStatus(color) {
  if (game.in_checkmate()) {
    $('#status').html(`<b>Checkmate!</b> Oops, <b>${color}</b> lost.`);
  } else if (game.insufficient_material()) {
    $('#status').html(`It's a <b>draw!</b> (Insufficient Material)`);
  } else if (game.in_threefold_repetition()) {
    $('#status').html(`It's a <b>draw!</b> (Threefold Repetition)`);
  } else if (game.in_stalemate()) {
    $('#status').html(`It's a <b>draw!</b> (Stalemate)`);
  } else if (game.in_draw()) {
    $('#status').html(`It's a <b>draw!</b> (50-move Rule)`);
  } else if (game.in_check()) {
    $('#status').html(`Oops, <b>${color}</b> is in <b>check!</b>`);
    return false;
  } else {
    $('#status').html(`No check, checkmate, or draw.`);
    return false;
  }
  return true;
}

function updateAdvantage() {
  if (globalSum > 0) {
    $('#advantageColor').text('Black');
    $('#advantageNumber').text(globalSum);
  } else if (globalSum < 0) {
    $('#advantageColor').text('White');
    $('#advantageNumber').text(-globalSum);
  } else {
    $('#advantageColor').text('Neither side');
    $('#advantageNumber').text(globalSum);
  }
  $('#advantageBar').attr({
    'aria-valuenow': `${-globalSum}`,
    style: `width: ${((-globalSum + 2000) / 4000) * 100}%`,
  });
}

/*
 * Calculates the best legal move for the given color.
 */
function getBestMove(game, color, currSum) {
  positionCount = 0;

  if (color === 'b') {
    var depth = parseInt($('#search-depth').find(':selected').text());
  } else {
    var depth = parseInt($('#search-depth-white').find(':selected').text());
  }

  var d = new Date().getTime();
  var [bestMove, bestMoveValue] = minimax(
    game,
    depth,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    true,
    currSum,
    color
  );
  var d2 = new Date().getTime();
  var moveTime = d2 - d;
  var positionsPerS = (positionCount * 1000) / moveTime;

  $('#position-count').text(positionCount);
  $('#time').text(moveTime / 1000);
  $('#positions-per-s').text(Math.round(positionsPerS));

  return [bestMove, bestMoveValue];
}

/*
 * Makes the best legal move for the given color.
 */
function makeBestMove(color) {
  if (color === 'b') {
    var move = getBestMove(game, color, globalSum)[0];
  } else {
    var move = getBestMove(game, color, -globalSum)[0];
  }

  globalSum = evaluateBoard(game, move, globalSum, 'b');
  updateAdvantage();

  game.move(move);
  board.position(game.fen());

  if (color === 'b') {
    checkStatus('black');

    // Highlight black move
    $board.find('.' + squareClass).removeClass('highlight-black');
    $board.find('.square-' + move.from).addClass('highlight-black');
    squareToHighlight = move.to;
    colorToHighlight = 'black';

    $board
      .find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight);
  } else {
    checkStatus('white');

    // Highlight white move
    $board.find('.' + squareClass).removeClass('highlight-white');
    $board.find('.square-' + move.from).addClass('highlight-white');
    squareToHighlight = move.to;
    colorToHighlight = 'white';

    $board
      .find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight);
  }
}

/*
 * Plays Computer vs. Computer, starting with a given color.
 */
function compVsComp(color) {
  if (!checkStatus({ w: 'white', b: 'black' }[color])) {
    timer = window.setTimeout(function () {
      makeBestMove(color);
      if (color === 'w') {
        color = 'b';
      } else {
        color = 'w';
      }
      compVsComp(color);
    }, 250);
  }
}

/*
 * Resets the game to its initial state.
 */
function reset() {
  game.reset();
  globalSum = 0;
  $board.find('.' + squareClass).removeClass('highlight-white');
  $board.find('.' + squareClass).removeClass('highlight-black');
  $board.find('.' + squareClass).removeClass('highlight-hint');
  board.position(game.fen());
  $('#advantageColor').text('Neither side');
  $('#advantageNumber').text(globalSum);

  // Kill the Computer vs. Computer callback
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/*
 * Event listeners for various buttons.
 */
$('#ruyLopezBtn').on('click', function () {
  reset();
  game.load(
    'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1'
  );
  board.position(game.fen());
  window.setTimeout(function () {
    makeBestMove('b');
  }, 250);
});
$('#italianGameBtn').on('click', function () {
  reset();
  game.load(
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1'
  );
  board.position(game.fen());
  window.setTimeout(function () {
    makeBestMove('b');
  }, 250);
});
$('#sicilianDefenseBtn').on('click', function () {
  reset();
  game.load('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
  board.position(game.fen());
});
$('#startBtn').on('click', function () {
  reset();
});

$('#compVsCompBtn').on('click', function () {
  reset();
  compVsComp('w');
});
$('#resetBtn').on('click', function () {
  reset();
});

var undo_stack = [];

function undo() {
  var move = game.undo();
  undo_stack.push(move);

  // Maintain a maximum stack size
  if (undo_stack.length > STACK_SIZE) {
    undo_stack.shift();
  }
  board.position(game.fen());
}

$('#undoBtn').on('click', function () {
  if (game.history().length >= 2) {
    $board.find('.' + squareClass).removeClass('highlight-white');
    $board.find('.' + squareClass).removeClass('highlight-black');
    $board.find('.' + squareClass).removeClass('highlight-hint');

    // Undo twice: Opponent's latest move, followed by player's latest move
    undo();
    window.setTimeout(function () {
      undo();
      window.setTimeout(function () {
        showHint();
      }, 250);
    }, 250);
  } else {
    alert('Nothing to undo.');
  }
});

function redo() {
  game.move(undo_stack.pop());
  board.position(game.fen());
}

$('#redoBtn').on('click', function () {
  if (undo_stack.length >= 2) {
    // Redo twice: Player's last move, followed by opponent's last move
    redo();
    window.setTimeout(function () {
      redo();
      window.setTimeout(function () {
        showHint();
      }, 250);
    }, 250);
  } else {
    alert('Nothing to redo.');
  }
});

$('#showHint').change(function () {
  window.setTimeout(showHint, 250);
});

function showHint() {
  var showHint = document.getElementById('showHint');
  $board.find('.' + squareClass).removeClass('highlight-hint');

  // Show hint (best move for white)
  if (showHint.checked) {
    var move = getBestMove(game, 'w', -globalSum)[0];

    $board.find('.square-' + move.from).addClass('highlight-hint');
    $board.find('.square-' + move.to).addClass('highlight-hint');
  }
}

/*
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */
function removeGreySquares() {
  $('#myBoard .square-55d63').css('background', '');
}

function greySquare(square) {
  var $square = $('#myBoard .square-' + square);

  var background = whiteSquareGrey;
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey;
  }

  $square.css('background', background);
}

function onDragStart(source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

  // or if it's not that side's turn
  if (
    (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  undo_stack = [];
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q', // NOTE: always promote to a queen for example simplicity
  });

  // Illegal move
  if (move === null) return 'snapback';

  globalSum = evaluateBoard(game, move, globalSum, 'b');
  updateAdvantage();

  // Highlight latest move
  $board.find('.' + squareClass).removeClass('highlight-white');

  $board.find('.square-' + move.from).addClass('highlight-white');
  squareToHighlight = move.to;
  colorToHighlight = 'white';

  $board
    .find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight);

  if (!checkStatus('black'));
  {
    // Make the best move for black
    window.setTimeout(function () {
      makeBestMove('b');
      window.setTimeout(function () {
        showHint();
      }, 250);
    }, 250);
  }
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

function onSnapEnd() {
  board.position(game.fen());
}
