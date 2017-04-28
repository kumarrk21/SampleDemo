({

	loadpdf:function(component,event){
		try{
			//var pdfjsframe = document.querySelector("#pdfViewer")
			var pdfData = component.get('v.pdfData');
			var raw = atob(pdfData);
			var uint8Array = new Uint8Array(raw.length);
			for (var i = 0; i < raw.length; i++) {
					uint8Array[i] = raw.charCodeAt(i);
			}
			var pdfjsframe = component.find('pdfViewer')
			pdfjsframe.getElement().contentWindow.PDFViewerApplication.open(uint8Array);
			//pdfjsframe.getElement().contentWindow.postMessage(pdfData,'*');
		}catch(e){
			console.log('Exception is', e);
		}
	}
})