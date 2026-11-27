import re, zipfile, shutil, sys, glob, os
HR = re.compile(r'<w:r\b[^>]*>(?:(?!</w:r>).)*?<w:pict>(?:(?!</w:pict>).)*?o:hr="t"(?:(?!</w:pict>).)*?</w:pict>\s*</w:r>', re.S)
for src in sorted(glob.glob('/home/claude/att/pdfwork/m*.docx')):
    dst = '/home/claude/man/src/' + os.path.basename(src)
    zin = zipfile.ZipFile(src); zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for it in zin.infolist():
        data = zin.read(it.filename)
        if it.filename == 'word/document.xml':
            x = data.decode('utf-8'); x = HR.sub('<w:r><w:t xml:space="preserve">§BR§</w:t></w:r>', x); data = x.encode('utf-8')
        zout.writestr(it, data)
    zout.close()
