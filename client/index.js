import './styles.scss';
import './CanvasInput';
import CanvasInput from './CanvasInput';

const canvas = document.getElementById('game');

const canvasInput = new CanvasInput(canvas);

canvasInput.on(CanvasInput.MOUSE_MOVE, (point, event) => {

});

