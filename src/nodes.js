export class Node{
    constructor(type, name, element, options=null){
        this.type = type;
        this.name = name;
        this.element = element;
        this._children = [];
    }

    addChild(node){
        this._children.push(node);
    }

    update(data){
        for(let node of this._children){
            if(typeof data[node.name] !== 'undefined'){
                node.update(data[node.name]);
            }
        }
    }

    find(name){
        for(let node of this._children){
            if(node.name === name){
                return node;
            }
        }
        return null;
    }

    dispose(){
        for(let node of this._children){
            node.dispose();
        }
        this.element = null;
        this._children = null;
    }
}

class LeafNode extends Node{
    addChild(node){

    }
}

class TextNode extends LeafNode{
    constructor(name, element){
        super('text', name, element);
    }
    update(value){
        this.element.textContent = value;
    }
}

class HtmlNode extends LeafNode{
    constructor(name, element){
        super('html', name, element);
    }
    update(value){
        this.element.innerHTML = value;
    }
}

class AttrNode extends LeafNode{
    constructor(name, element, attrname){
        if(!attrname){
            throw new Error('Expected name for attribute name');
        }
        super('attr', name, element);
        this.attrname = attrname;
    }
    update(value){
        this.element[this.attrname] = value;
    }
}
class DatasetNode extends LeafNode{
    constructor(name, element, setname){
        if(!setname){
            throw new Error('Expected name for dataset attribute');
        }
        super('dataset', name, element);
        this.setname = setname;
    }
    update(value){
        this.element.dataset[this.setname] = value;
    }
}

class ClassNode extends LeafNode{
    constructor(name, element, value = null){
        super('class', name, element);
        this.value = value;
    }
    update(value){
        if(this.value){
            if(value){
                this.element.classList.add(this.value);
            }else{
                this.element.classList.remove(this.value);
            }
        }else{
            if(this.actualValue){
                this.element.classList.remove(this.actualValue);
            }
            this.actualValue = value;
            this.element.classList.add(value);
        }
    }
}

export class RootNode extends Node{
    constructor(element){
        super('root', 'root', element);
    }
}

export class MultipleNode extends Node{
    update(data){
        this._children.forEach(node => {
            node.update(data);
        });
    }
}

export function walker(parent, config, element){
    let node;
    Object.keys(config).forEach(name => {
        if(typeof config[name] === 'string'){
            node = nodeFactory(name, element, config[name]);
            parent.addChild(node);
        }else if(Array.isArray(config[name])){
            let multiple = new MultipleNode('multiple', name);
            config[name].forEach(sub => {
                node = nodeFactory(name, element, sub);
                multiple.addChild(node);
            });
            parent.addChild(multiple);
        }else{
            node = new Node('node', name);
            walker(node, config[name], element);
            parent.addChild(node);
        }
    });
}

function parseConfig(text){
   let [selector, rest] = text.split('@');
   if(!rest){
        rest = 'text';
   }
   let [type, options] = rest.split(':');

   return {
        selector: selector,
        type:type,
        options: options
   };
}

const NODES = {
    text:function(name, element){
        return new TextNode(name, element);
    },
    html:function(name, element){
        return new HtmlNode(name, element);
    },
    dataset:function(name, element, options){
        return new DatasetNode(name, element, options);
   },
    'class':function(name, element, options){
        return new ClassNode(name, element, options);
    },
    attr:function(name, element, options){
        return new AttrNode(name, element, options);
    }
};


function nodeFactory(name, element, config){
    if(typeof config === 'string'){
        config = parseConfig(config);
    }
    if(NODES[config.type]){
        let dom = element.querySelector(config.selector);
        return NODES[config.type](name, dom, config.options);
    }
    return new TextNode('name', element);
}