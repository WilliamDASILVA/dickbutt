var _elements = [];
var collisionGroups = [];
var collisionNumber = 1;

/*    --------------------------------------------------- *\
        [class] Elements()

        * Un element dans le jeu, peu importe quoi *

\*    --------------------------------------------------- */
class Elements extends p2.Body{

    public haveCollision: boolean;
    public backupShape: any;

    public drawables : any;
    public eType: string;
    public datas: any[];
    public static: boolean;
    public shapeAngle: number;
    public depth: number;
    
    public canCollide: string[];
    public colGroup: number;
    public isSensor: boolean;

    private centred : boolean; // If the element is centred to the position

    /*    --------------------------------------------------- *\
            [function] constructor()
    
            * Quand un element est crée *
    
            Return: nil
    \*    --------------------------------------------------- */
    constructor(mass = 100, isStatic? : boolean){
        super({
            mass: mass,
            position: [0,0],
            velocity: [0,0],
            angle: 0,
            angularVelocity: 0,
            force: [0,0],
            angularForce: 0,
            fixedRotation: 0,
        });

        this.drawables = [];
        this.datas = [];
        this.canCollide = [];

        this.isSensor = false;

        this.haveCollision = false;
        this.colGroup = 0;
        this.eType = "";
        this.shapeAngle = 0;
        this.depth = 0;

        this.static = isStatic || false;

        if(!isStatic){
            _elements.push(this);
        }

        this.centred = false;

    }

    setCentred(value : boolean){
        this.centred = value;
    }

    isCentred(){
        return this.centred;
    }

    /*    --------------------------------------------------- *\
            [function] getDepth()
    
            * Retourne la profondeur de champ *
    
            Return: depth
    \*    --------------------------------------------------- */
    getDepth(){
        return this.depth;
    }


    setDepth(depth:number){
        this.depth = depth;
    }

    /*    --------------------------------------------------- *\
            [function] addShape(shape, offset, angle)
    
            * Add a shape to the body *
    
            Return: nil
    \*    --------------------------------------------------- */
    addShape(shape : any, offset? : any, angle? : any){
        if(shape.body){
            throw new Error('A shape can only be added to one body.');
        }
        shape.body = this;

        // Copy the offset vector
        if(offset){
            p2.vec2.copy(shape.position, offset);
        } else {
            p2.vec2.set(shape.position, 0, 0);
        }

        shape.angle = angle || 0;

        this.shapes.push(shape);
        this.updateMassProperties();
        this.updateBoundingRadius();

        this.aabbNeedsUpdate = true;

        // set the body as a sensor by default
        if(this.shapes[0]){
            this.shapes[0].sensor = true;
        }

        // remove the body sensor if it has to collide with something
        var ourID = null;
        for (var g = 0; g < collisionGroups.length; ++g) {
            if(collisionGroups[g].name == this.getType()){
                ourID = collisionGroups[g].id;
            }
        }
        
        var mask = 0;
        for (var q = this.canCollide.length - 1; q >= 0; q--) {
            for (var x = collisionGroups.length - 1; x >= 0; x--) {
                if(collisionGroups[x].name == this.canCollide[q]){
                    mask = mask | Math.pow(2, collisionGroups[x].id);

                    // We update the collision group to the shape
                    if(this.shapes.length != 0){
                        for (var k in this.shapes) {                            
                            this.shapes[k].collisionGroup = Math.pow(2, ourID);
                        }
                    }
                }    
            }
        }

        if(this.shapes[0]){
            this.shapes[0].collisionMask = mask;
            if (!this.isSensor){
                this.shapes[0].sensor = false;
            }
        }
    }

    /*    --------------------------------------------------- *\
            [function] setPosition(x (point), y)
    
            * Set la position de l'element *
    
            Return: nil
    \*    --------------------------------------------------- */
    setPosition(x : any, y? : number){
        if(x instanceof Point){
            this.position[0] = x.x;
            this.position[1] = x.y;
        }
        else{
            this.position[0] = x;
            this.position[1] = y;
        }
        
        if(this.getAssignedDrawables() != 0){
            for (var i = 0; i < this.getAssignedDrawables().length; ++i) {
                var offset = this.getAssignedDrawables()[i].getOffset();
                var size = this.getAssignedDrawables()[i].getSize();
                if(this.isCentred()){
                    this.getAssignedDrawables()[i].setPosition((x + offset.x) - size.width/2, (y + offset.y) - size.height / 2);
                }
                else{
                    this.getAssignedDrawables()[i].setPosition((x + offset.x), (y + offset.y));
                }
            }
        }

        // Reset the position of the shape
        if(this.shapes[0]){
            if(this.shapes[0].hasOwnProperty("position") && this.shapes[0].hasOwnProperty("width") && this.shapes[0].hasOwnProperty("height")){
                var shapePos = this.shapes[0]['position'];
                this.shapes[0]['position'] = [this.shapes[0]['width']/2, this.shapes[0]['height']/2];
            }
        }

    }

    /*    --------------------------------------------------- *\
            [function] setRotation(angle)

            * Set l'angle de rotation de l'element *

            Return: nil
    \*    --------------------------------------------------- */
    setRotation(angle : number){
        this.angle = (angle * Math.PI) / 180;
        this.shapeAngle = angle;
        if(this.getAssignedDrawables() != 0){
            for (var i = 0; i < this.getAssignedDrawables().length; ++i) {
                this.getAssignedDrawables()[i].setRotation(angle);
            }
        }
    }

    /*    --------------------------------------------------- *\
            [function] getRotation()
    
            * Retourne l'ange de rotation de l'element *
    
            Return: angle
    \*    --------------------------------------------------- */
    getRotation(){
        return this.shapeAngle;
    }

    /*    --------------------------------------------------- *\
            [function] getPosition()
    
            * Retourne la position de l'element *
    
            Return: position
    \*    --------------------------------------------------- */
    getPosition():Point{
        return new Point(this.position[0], this.position[1]);
    }

    /*    --------------------------------------------------- *\
            [function] assignDrawable(drawable)
    
            * Assigne un drawable à un element *
    
            Return: nil
    \*    --------------------------------------------------- */
    assignDrawable(drawable: Render.Drawable){
        this.drawables.push(drawable);
        this.setPosition(this.getPosition().x, this.getPosition().y);
    }

    setDrawable(drawable : Render.Drawable, index = 0){
        this.drawables[index] = drawable;
        this.setPosition(this.getPosition().x, this.getPosition().y);
    }

    /*    --------------------------------------------------- *\
            [function] getAssignedDrawables()
    
            * Retourne le drawable assigné à l'element *
    
            Return: drawable
    \*    --------------------------------------------------- */
    getAssignedDrawables(){
        return this.drawables;
    }

    /*    --------------------------------------------------- *\
            [function] setType(type)
    
            * Set le type de l'element *
    
            Return: nil
    \*    --------------------------------------------------- */
    setType(eType:string){
        this.eType = eType;
        // We add this type to the global collision groups if it doesn't exists
        var exists = false;
        var id = 0;
        for (var i in collisionGroups) {
            if(collisionGroups[i].name != this.getType()){
                exists = true;
                id = collisionGroups[i].id;
            }
        }

        if(!exists){
            this.addCollisionGroup();
        }
        else{
            this.setCollisionId(id);
        }

    }

    /*    --------------------------------------------------- *\
            [function] addCollisionGroup()
    
            Return: nil
    \*    --------------------------------------------------- */
    private addCollisionGroup(){
        collisionGroups.push({
            id : collisionNumber,
            name : this.getType()
        });
        this.setCollisionId(collisionNumber);
        collisionNumber++;
    }

    /*    --------------------------------------------------- *\
            [function] getType()
    
            * Retourne le type de l'element *
    
            Return: type
    \*    --------------------------------------------------- */
    getType(){
        return this.eType;
    }

    /*    --------------------------------------------------- *\
            [function] setCollisionId(id)
    
            * Set l'id du groupe de collision *
    
            Return: nil
    \*    --------------------------------------------------- */
    setCollisionId(id : number){
        this.colGroup = id;
    }

    /*    --------------------------------------------------- *\
            [function] getCollisionId()
    
            * Retourne l'id du groupe de collision *
    
            Return: id
    \*    --------------------------------------------------- */
    getCollisionId(){
        return this.colGroup;
    }

    /*    --------------------------------------------------- *\
            [function] setData(dataName, value)
    
            * Set la data de la tile *
    
            Return: nil
    \*    --------------------------------------------------- */
    setData(dataName: string, dataValue : any){
        var data = {
            name: dataName,
            value: dataValue
        };

        this.datas.push(data);
    }

    /*    --------------------------------------------------- *\
            [function] getData(dataName)
    
            * Retourne la data d'une tile *
    
            Return: dataValue
    \*    --------------------------------------------------- */
    getData(dataName:string){
        var valueToReturn = null;
        for (var i = this.datas.length - 1; i >= 0; i--) {
            if(this.datas[i].name == dataName){
                valueToReturn = this.datas[i].value;
            }
        }

        return valueToReturn;
    }

    /*    --------------------------------------------------- *\
            [function] setMass()
    
            * Set la masse d'un element *
    
            Return: nil
    \*    --------------------------------------------------- */
    setMass(mass:number){
        this.mass = mass;
        this.updateMassProperties();
    }

    /*    --------------------------------------------------- *\
            [function] getMass()
    
            * Retourne la masse d'un element *
    
            Return: mass
    \*    --------------------------------------------------- */
    getMass(){
        return this.mass;
    }

    /*    --------------------------------------------------- *\
            [function] setFixedRotation(boolean)
    
            * Set si l'element a une rotation fixe *
    
            Return: nil
    \*    --------------------------------------------------- */
    setFixedRotation(value : boolean){
        if(value){
            this.fixedRotation = 1;
        }
        else{
            this.fixedRotation = 0;
        }
    }

    /*    --------------------------------------------------- *\
            [function] getFixedRotation()
    
            * Retourne si la rotation est fixe ou non *
    
            Return: true, false
    \*    --------------------------------------------------- */
    getFixedRotation():boolean{
        if(this.fixedRotation == 1){
            return true;
        }
        else{
            return false;
        }
    }

    /*    --------------------------------------------------- *\
            [function] canCollideWith(elements...)
    
            * Set la liste des elements avec lequel cet element peut avoir une collision *
    
            Return: nil
    \*    --------------------------------------------------- */
    canCollideWith(...parameters : string[]){
        if(parameters){
            for (var i = parameters.length - 1; i >= 0; i--) {
                this.canCollide.push(parameters[i]);
            }

            this.updateCollisions();
        }

    }

    /*    --------------------------------------------------- *\
            [function] updateCollisions()
    
            * Met a jour les groupes de collision *
    
            Return: nil
    \*    --------------------------------------------------- */
    updateCollisions(){
        // On commence par vérifier si tous les groupes ont étés crées, sinon on les crées
        var temp = this.canCollide;
        var groupsCollide = [];
        for (var i = this.canCollide.length - 1; i >= 0; i--) {
            groupsCollide.push({
                exists : false,
                type : this.canCollide[i]
            });
        }

        for (var i = groupsCollide.length - 1; i >= 0; i--) {
            for (var k in collisionGroups) {
                if(collisionGroups[k].name == groupsCollide[i].type){
                    groupsCollide[i].exists = true;
                }
            }
        }

        // On crée le groupe si il n'existe pas
        for (var i = groupsCollide.length - 1; i >= 0; i--) {
            if(groupsCollide[i].exists == false){
                collisionGroups.push({
                    id : collisionNumber,
                    name : groupsCollide[i].type
                });
                collisionNumber++;
            }
        }
    }

    /*    --------------------------------------------------- *\
            [function] destroy()
    
            * Déturit l'element *
    
            Return: nil
    \*    --------------------------------------------------- */
    destroy(){
        if(this.world){
            this.world.removeBody(this);
        }

        for (var i = _elements.length - 1; i >= 0; i--) {
            if(_elements[i] == this){
                _elements.splice(i, 1);
            }
        }

        delete this;
    }

    setVelocity(x : number, y : number){
        this.velocity[0] = x;
        this.velocity[1] = y;
    }

    getVelocity(){
        return {x : this.velocity[0], y : this.velocity[1]};
    }

}