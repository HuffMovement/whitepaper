var fs = require('fs');
var mds = require('markdown-styles');
var phantom = require('phantom');

var inputdir = './build';
var outputdir = './dist';

const chapters = fs.readdirSync('./chapters')
    .flatMap((c) => fs.readdirSync(`./chapters/${c}`)
        .filter(f => f.match(/.md$/))
        .map(f => `./chapters/${c}/${f}`))
    .reduce((acc,f) => `${acc}${fs.readFileSync(f, 'UTF-8')}\n`, '');

const pictures = fs.readdirSync('./chapters')
    .flatMap((c) => fs.readdirSync(`./chapters/${c}`)
        .filter(f => f.match(/.jpg$/))
        .map(f => [`./chapters/${c}/${f}`, `./dist/${f}`]))

fs.rmdirSync(inputdir, { recursive: true });
fs.rmdirSync(outputdir, { recursive: true });
fs.mkdirSync(inputdir);
fs.mkdirSync(outputdir);
fs.writeFileSync(`${inputdir}/index.md`, chapters, 'UTF-8');
pictures.map(([a,b]) => fs.copyFileSync(a,b));

function createpdf(htmlFile, pdfFile) {
    console.log("Html file %s", htmlFile);
    console.log("PDF file %s", pdfFile);

    phantom.create().then(function (ph) {
        ph.createPage().then(function (page) {
            page.property('paperSize', { format: 'A4', orientation: 'portrait', border: '1cm' }).then(function () {
                page.property('zoomFactor', 300.0 / 72.0).then(function () {
                    page.open(htmlFile).then(function (status) {
                        page.render(pdfFile).then(function () {
                            console.log('Page Rendered %s', pdfFile);
                            ph.exit();
                        });
                    });
                });
            });
        });
    });
}

const mdfile = 'index.md'
var markdownextension = '.md';
var htmlextension = ".html";
var pdfextension = ".pdf";
var mdfilePath = inputdir + '/' + mdfile;
console.log ("Markdown file path %s", mdfilePath);
mds.render(mds.resolveArgs({
    input: mdfilePath,
    output: outputdir,
    layout: 'github',
}), function () {
    var htmlFile = outputdir + '/' + mdfile.replace(markdownextension, htmlextension);
    var pdfFile = outputdir + '/' + mdfile.replace(markdownextension, pdfextension);
    createpdf(htmlFile, pdfFile);
});
