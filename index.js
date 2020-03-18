const fs = require('fs');
const {parse} = require('node-html-parser');

const HTML_DIR = "./src/html";
const OUTPUT_DIR = "./out/html";

OUTPUT_DIR.split("/").reduce((prev, curr) => {
    const path = `${prev}/${curr}`
    !fs.existsSync(path) && fs.mkdirSync(path);
    return path;
})

const styles = {};

const parseNode = node => {
    const style = node.getAttribute('style');
    node.removeAttribute('style');
    if(style){
        const classNames = node.classNames.length ? node.classNames.join(".") : null;
        const selector = classNames || node.tagName;
        styles[selector] = {type:classNames ? 'class' : 'tag', style};
    }
    if(node.childNodes){
        node.childNodes.forEach(_node => {
            if(_node.getAttribute) parseNode(_node)
        })
    }
}

let globalStyle = "";
const components = fs.readdirSync(HTML_DIR);
components.forEach(componentFileName => {
    const componentData = fs.readFileSync(`${HTML_DIR}/${componentFileName}`, 'utf-8');
    const root = parse(componentData);
    root.childNodes.forEach(node => {
        parseNode(node);
    });

    const componentName = componentFileName.split(".")[0];

    let rawStyle = `/*-------------\n---${componentName} style\n-------------*/\n`;
    Object.entries(styles).forEach(([key, value])=>{
        const attributes = value.style.split(";").filter(e => e !== ';\n');
        rawStyle += `${value.type === 'class' ? '.' : ''}${key} {\n\t${attributes.join(';\n\t')}\n}\n`;
    });
    globalStyle += rawStyle + "\n"
    !fs.existsSync(`${OUTPUT_DIR}/${componentName}`) && fs.mkdirSync(`${OUTPUT_DIR}/${componentName}`);
    fs.writeFileSync(`${OUTPUT_DIR}/${componentName}/${componentName}.css`, rawStyle);
    fs.writeFileSync(`${OUTPUT_DIR}/${componentName}/${componentName}.html`, root.outerHTML);
});

!fs.existsSync(`${OUTPUT_DIR}/css`) && fs.mkdirSync(`${OUTPUT_DIR}/css`);
fs.writeFileSync(`${OUTPUT_DIR}/css/style.css`, globalStyle);