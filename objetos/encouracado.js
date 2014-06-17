var encouracado = function(x,y,vertical){
    this.x = parseInt(x);
    this.y = parseInt(y);
    this.size = 3;
    this.name = "Encouraçado";
    this.vertical = vertical;
    this.positions = [];

    for(i = 0; i < this.size; i++)
        if(this.vertical)
            this.positions[i] = { x : this.x, y : this.y + i, destroyed : false };
        else
            this.positions[i] = { x : this.x + i, y : this.y, destroyed : false };

    this.destroyed = function() {
        var _destroyed = true;
        for(i = 0; i < this.size; i++)
        {
            if(!this.positions[i].destroyed)
                _destroyed = false;
        }
        return _destroyed;
    };
};

module.exports = encouracado;


