var fs = require('fs');
var mds = require('markdown-styles');
var phantom = require('phantom');

var inputdir = './build';
var outputdir = './dist';

const files = fs.readdirSync('./chapters')
    .reduce((acc, c) => [
        ...acc,
        ...(fs.readdirSync(`./chapters/${c}`) || [])
            .map(f => [`./chapters/${c}/${f}`, f])
    ], []);
const chapters = files
    .filter(([f]) => f.match(/.md$/))
    .reduce((acc, [f]) => `${acc}${fs.readFileSync(f, 'UTF-8')}\n`, '');

if (fs.existsSync(inputdir)) {
    fs.rmdirSync(inputdir, { recursive: true });
}
if (fs.existsSync(outputdir)) {
    fs.rmdirSync(outputdir, { recursive: true });
}
fs.mkdirSync(inputdir);
fs.mkdirSync(outputdir);
fs.writeFileSync(`${inputdir}/index.md`, chapters, 'UTF-8');

files.filter(([f]) => f.match(/.jpg$/))
    .forEach(([p,f]) =>
        fs.copyFileSync(p, `./dist/${f}`));

function createpdf(htmlFile, pdfFile) {
    console.log("Html file %s", htmlFile);
    console.log("PDF file %s", pdfFile);

    phantom.create().then(function (ph) {
        ph.createPage().then(function (page) {
            page.property('paperSize', { format: 'A4', orientation: 'portrait', border: '1cm' }).then(function () {
                page.open(htmlFile).then(function (status) {
                    page.render(pdfFile).then(function () {
                        console.log('Page Rendered %s', pdfFile);
                        ph.exit();
                    });
                });
            });
        });
    });
}

const mdfile = 'index.md'
var markdownextension = '.md';
var htmlextension = ".html";
var mdfilePath = inputdir + '/' + mdfile;
console.log ("Markdown file path %s", mdfilePath);
mds.render(mds.resolveArgs({
    input: mdfilePath,
    output: outputdir,
    layout: 'github',
}), function () {
    var htmlFile = outputdir + '/' + mdfile.replace(markdownextension, htmlextension);
    const html = fs.readFileSync(htmlFile, 'UTF-8');
    if (process.env.DEV) {
        fs.writeFileSync(htmlFile, html.replace('</body>', `
        <style>
            body {
                max-width: 1400px;
            }
            .markdown-body {
                font-size: 31px;
            }
            .markdown-body img {
                max-width: 1000px;
                margin: 5px auto;
                display: block;
            }
        </style>
    </body>
        `), 'UTF-8');
    } else {
        fs.writeFileSync(htmlFile, html.replace('</body>', `
        <style>
            body {
                max-width: 700px;
            }
            .markdown-body {
                font-size: 10px;
            }
            .markdown-body img {
                max-width: 400px;
                margin: 5px auto;
                display: block;
            }
        </style>
    </body>
        `), 'UTF-8');
    }
    var pdfFile = `${outputdir}/saving_manifest.pdf`;
    createpdf(htmlFile, pdfFile);
});
