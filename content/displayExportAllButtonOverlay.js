var buttonExportAllCertificates =
{
  onLoad: function(event)
  {
    // initialization code
    this.initialized = true;

	try
	  {
	dump(dumpObject(event, "event", 10));
    dump(dumpObject(event.target, "event.target", 10));

    var doc = event.target;
	alert("I am " + doc);

    this.strings = doc.getElementById("export_all_certificates-strings");

    if (this.strings)
    {
      alert("Dumping this.strings...");
      dump(this.strings);
    }
    else
    {
      alert("Could not get bundle " + typeof this.strings);
      notfound = this.strings.getString("exportAll.label");
      alert("Could not end");
    }
  } catch(e) { alert("Hitting alert " + e); }

    this.addExportAllButton();
  },

  addExportAllButton: function()
  {
    // We place the ExportAll button before the Delete button.
    var deleteButton = document.getElementById("ca_deleteButton");

    if (!deleteButton) { return; }

    /* Create our new button */
    var exportAllButton = document.createElement("button");
    exportAllButton.setAttribute("id", "ca_exportAllButton");
    exportAllButton.setAttribute("class", "normal");
    exportAllButton.setAttribute("label", "Export All...");
                                 // this.strings.getString("&exportAll.label;"));
    exportAllButton.setAttribute("accesskey", "A");
                                 // this.strings.getString("&exportAll.accesskey;"));
    exportAllButton.setAttribute("oncommand",
                  "buttonExportAllCertificates.saveExportedCertificates();");

    deleteButton.parentNode.insertBefore(exportAllButton, deleteButton);
  },

  saveExportedCertificates: function()
  {
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    var nsIFilePicker = Ci.nsIFilePicker;
    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "&exportAll.messageSelectFolder;", nsIFilePicker.modeGetFolder);
    fp.appendFilter("&exportAll.derCertificate;","*.der");

    var res = fp.show();
    if (res == nsIFilePicker.returnOK)
    {
      var moz_x509certdb2 = Cc['@mozilla.org/security/x509certdb;1']
                            .getService(Ci.nsIX509CertDB2);
      var allCertificates = moz_x509certdb2.getCerts();
      var enumCertificates = allCertificates.getEnumerator();

      var counter = 0;

      while (enumCertificates.hasMoreElements())
      {
        var thisElement = enumCertificates.getNext();
        var thisCertificate = thisElement.QueryInterface(Ci.nsIX509Cert);

        var DER = thisCertificate.getRawDER({});
        this.writeCertificateFile(DER, DER.length, fp.file.path);
        counter++;
      }
      alert(this.strings.getFormattedString("exportAll.messageTotalExported", [counter, fp.file.path]));
      alert("Done with writing");
    }
  },

  writeCertificateFile: function(der, len, filepath)
  {
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

    aFile.initWithPath(filepath + "/RootCertificates.der");
    aFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0644);

    var stream = Cc["@mozilla.org/binaryoutputstream;1"].
                    createInstance(Ci.nsIBinaryOutputStream);

    var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
                         createInstance(Ci.nsIFileOutputStream);
    foStream.init(aFile, 0x02 | 0x08 | 0x20, 0644, 0); // write, create, truncate

    stream.setOutputStream(foStream);
    stream.writeByteArray(der, len);

    if (stream instanceof Ci.nsISafeOutputStream)
    {
      stream.finish();
    }
    else
    {
      stream.close();
    }
  }
};

window.addEventListener("load", function(event) { buttonExportAllCertificates.onLoad(event); }, false);

function dumpObject(obj, name, maxDepth) 
{
	for(var item in obj)
	{
		try{
		dump(name + "[" + item + "] = " + obj[item] + "\n");
		} catch (e) { dump("GOT PROBLEM WITH name[" + item + "]\n;")} 
	}
}
