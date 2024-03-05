'use strict'

const keys = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    space: ' '
};

let game = {
    running: true,
    ctx: null,
    platform: null,
    ball: null,
    blocks: [],
    score: 0,
    width: 640,
    height: 360,
    rows: 4,
    cols: 8,

    sprites: {
        background: null,
        block: null,
        ball: null,
        platform: null
    }, 
    sounds: {
        bump: null,
        victory: null ,
        gameover: null
    },

    init() {
        this.ctx = document.querySelector('#mycanvas').getContext('2d');
        this.setEvents();

        this.setTextFont();
    },

    setTextFont() {
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#fff';
    },

    setEvents() {
        window.addEventListener('keydown', (evt) => {
            if (evt.key === keys.space) {
                this.platform.fire();
            }
            else if (evt.key === keys.right || evt.key === keys.left) {
                this.platform.start(evt.key);
            }
        })

        window.addEventListener('keyup', () => {
            this.platform.stop();
        })
    },

    preload(callback) {
        let loaded = 0;
        let required = Object.keys(this.sprites).length;
        required += Object.keys(this.sounds).length;

        function onResourceLoad() {
            ++loaded;

            if (loaded >= required) {
                callback();    
            }
        }

        this.preloadSprites(onResourceLoad);
        this.preloadSounds(onResourceLoad);
    },

    preloadSprites(onResourceLoad) {
        for (let key in this.sprites) {
            this.sprites[key] = document.createElement('img');
            this.sprites[key].src = 'images/' + key + '.png';

            this.sprites[key].addEventListener('load', onResourceLoad);
        }
    },

    preloadSounds(onResourceLoad) {
        for (let key in this.sounds) {
            this.sounds[key] = new Audio('sounds/' + key + '.mp3');
            this.sounds[key].addEventListener('canplaythrough', onResourceLoad, {once: true});
        }
    },

    create() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.blocks.push({
                    active: true,
                    width: 60,
                    height: 20,
                    x: 64 * col + 65,
                    y: 24 * row + 35 
                });
            }
        }
    },

    update: function() {
        this.collideBlocks();
        this.collidePlatform();
        this.platform.collideWithScreen();
        this.ball.collideWithScreen();
        this.platform.movie();
        this.ball.movie();
    },

    addScore() {
        ++this.score;

        if (this.score >= this.blocks.length) {
            this.sounds.victory.play();
            game.end('Congratulation!!! You win!!!');
        }
    },

    collideBlocks() {
        for (let block of this.blocks) {
            if (block.active && this.ball.collide(block)) {
                    this.ball.bumpBlock(block);

                    this.addScore();

                    this.sounds.bump.play();
            }
            
        }
    },

    collidePlatform() {
        if (this.ball.collide(this.platform)) {
            this.ball.bumpPlatform(this.platform);
            this.sounds.bump.play();
        }
    },

    run() {
        window.requestAnimationFrame( () => {
            if (this.running) {
                this.update();
                this.render();
                this.run();
            } 
        });
    },

    render() {
        //очистка canvasa
        this.ctx.clearRect(0, 0, this.width, this.height);


        this.ctx.drawImage(this.sprites.background, 0, 0);
        this.ctx.drawImage(this.sprites.ball, this.ball.frame * this.ball.width, 0, this.ball.width, this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height);
        this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);

        this.renderBlocks();
        
        this.ctx.fillText('Score: ' + this.score, 15, 25);
    },

    renderBlocks() {
        for (let block of this.blocks) {
            if (block.active) {
                this.ctx.drawImage(this.sprites.block, block.x, block.y);
            }
        }
    },

    start() {
        this.init();
        this.preload(() => {
            this.create();
            this.run();
        });
    },

    end(message) {
        this.running = false;
        alert(message);
        window.location.reload();
    },

    random: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

game.ball = {
    velocity: 3,
    dx: 0,
    dy: 0,
    frame: 0,
    x: 320,
    y: 280,
    width: 20,
    height: 20,
    start() {
        this.dy = -this.velocity;
        this.dx = game.random(-this.velocity, this.velocity);

        this.animation();        
    }, 
    //aнимация мяча
    animation() {
        setInterval(() => {
            ++this.frame;
            {
                if (this.frame > 3) {
                    this.frame = 0;
                }
            }    
        }, 10)
    },
    movie() {
        if (this.dy) {
            this.y += this.dy;
        }
        if (this.dx) {
            this.x +=this.dx;
        }
    },
    collide(elem) {
        let x = this.x + this.dx;
        let y = this.y + this.dy;

        if (x + this.width > elem.x &&
            x < elem.x + elem.width &&
            y + this.height > elem.y &&
            y < elem.y + elem.height) {
                return true;
            }

            return false;
    },
    collideWithScreen() {
        let x = this.x + this.dx;
        let y = this.y + this.dy;

        let ballLeft = x;
        let ballRight = ballLeft + this.width;
        let ballTop = y;
        let ballBottom = ballTop + this.height;

        let screenRight = game.width;
        let screenLeft = 0;
        let screenTop = 0;
        let screenBottom = game.height;

        if (ballLeft < screenLeft) {
            this.x = 0;
            this.dx = this.velocity;
            game.sounds.bump.play();
        } else if (ballRight > screenRight) {
            this.x = screenRight - this.width;
            this.dx = -this.velocity;
            game.sounds.bump.play();
        } else if (ballTop < screenTop) {
            this.y = 0;
            this.dy = this.velocity;
            game.sounds.bump.play();
        } else if (ballBottom > screenBottom) {
            game.sounds.gameover.play();
            game.end('You lost! Try it again!');
        }
     },

    bumpBlock(block) {
        this.dy *= -1;
        block.active = false;
    },
    bumpPlatform(platform) {
        if (platform.dx) {
            this.x += platform.dx;    
        }

        if (this.dy > 0) {
            this.dy = -this.velocity;
            let touchX = this.x + this.width / 2;
            this.dx = this.velocity * platform.getTouchOffset(touchX);
        }
    }
}

game.platform = {
    velocity: 6,
    dx: 0,
    x: 280,
    y: 300,
    width: 100,
    height: 14,
    ball: game.ball,
    start(direction) {
        if (direction === keys.right) {
            this.dx = this.velocity;    
        } else if (direction === keys.left) {
            this.dx = -this.velocity;
        }
    },
    fire() {
        if (this.ball) {
            this.ball.start();
            this.ball = null;
        }
    },
    stop() {
        this.dx = 0;    
    },
    movie() {
        if (this.dx) {
            this.x += this.dx;
            if (this.ball) {
                this.ball.x += this.dx;
            }
        }
    },
    getTouchOffset(x) {
        let diff = (this.x + this.width) - x;
        let offset = this.width - diff;
        let result = 2 * offset / diff;
        return result - 1;
    },
    collideWithScreen() {
        let x = this.x + this.dx;

        let platformLeft = x;
        let platformRight = platformLeft + this.width;

        let screenRight = game.width;
        let screenLeft = 0;

        if (platformLeft < screenLeft || platformRight > screenRight) {
            this.dx = 0;
        }
    }
}




window.addEventListener('load', () => {
    
    game.start();
    
})

