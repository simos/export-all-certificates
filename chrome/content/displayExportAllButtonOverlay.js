/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Export All Certificates.
 *
 * The Initial Developer of the Original Code is
 * Simos Xenitellis.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const Cc = Components.classes;
const Ci = Components.interfaces;

var buttonExportAllCerts =
{
  bundle: Cc["@mozilla.org/intl/stringbundle;1"]  
              .getService(Ci.nsIStringBundleService)  
              .createBundle("chrome://export_all_certificates/locale/export" +
              		"_all_certificates.properties"),

  onLoad: function(event)
  {
    // We place the ExportAll button before the Delete button.
    var deleteButton = document.getElementById("ca_deleteButton");

    if (!deleteButton) { return; }

    // Create our new button.
    var exportAllButton = document.createElement("button");
    exportAllButton.setAttribute("id", "ca_exportAllButton");
    exportAllButton.setAttribute("class", "normal");
    exportAllButton.setAttribute("label", 
                  this.bundle.GetStringFromName("exportAll.label"));
    exportAllButton.setAttribute("accesskey", 
                  this.bundle.GetStringFromName("exportAll.accesskey"));
    exportAllButton.setAttribute("oncommand",
                  "buttonExportAllCerts.saveExportedCertificates();");

    deleteButton.parentNode.insertBefore(exportAllButton, deleteButton);
  },

  saveExportedCertificates: function()
  {
    var nsIFilePicker = Ci.nsIFilePicker;
    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

    fp.init(window, 
            this.bundle.GetStringFromName("exportAll.messageSelectFolder"), 
            nsIFilePicker.modeGetFolder);

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
        this.writeCertificateFile(DER, DER.length, fp.file.path,
                                    counter+1,
                                    thisCertificate.commonName,
                                    thisCertificate.organization);
        counter++;
      }
      
      var params = { countCerts: counter, locationCerts: fp.file.path };

      window.openDialog("chrome://export_all_certificates/content/dialogCompleted.xul", 
                        "export-all-certificates-completed",
                        "chrome,dialog,modal", 
                        params);
    }
  },

  writeCertificateFile: function(der, len, filepath, counter, CN, O)
  {
    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    
    aFile.initWithPath(filepath);
    aFile.append(this.prepareFilename(counter, CN, O));
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
  },

  // Produces a filename of the form
  //  Cert-xxx_CN_O.der,
  // where
  //       Cert: is a localisable string
  //        xxx: is the index number of this certificate
  //         CN: is the canonical name of the certificate, if it exists
  //          O: is the organisation string for this certificate, if it exists
  // If both CN, O do not exist, 'unnamed' is used in their place.
  prepareFilename: function(counter, CN, O)
  {
    var filename;
    var unnamed;
    var stringCN;
    var stringO;

    filename = this.bundle.GetStringFromName("exportAll.rootcertFilenameStart");
    unnamed = this.bundle.GetStringFromName("exportAll.unnamed");
    
    filename += '-';
    filename += this.prependZeroes(counter);

    if (!!CN)
    {
      stringCN = CN.replace(/[:\\\/]/g, '-');

      filename += '_';
      filename += stringCN;
    }

    if (!!O)
    {
      stringO = O.replace(/[:\\\/]/g, '-');

      filename += '_';
      filename += stringO;
    }

    if (! !!CN && ! !!O)
    {
      filename += '_' + unnamed;
    }

    if (filename.charAt(filename.length - 1) == '.')
      filename += 'der';
    else
      filename += '.der';

    return filename;
  },

  prependZeroes: function(number)
  {
    if (number < 10)
      return '00' + number;
    else if (number < 100)
      return '0' + number;
    else 
      return '' + number;
  }
};

window.addEventListener("load", 
          function(event) { buttonExportAllCerts.onLoad(event); }, 
          false);
