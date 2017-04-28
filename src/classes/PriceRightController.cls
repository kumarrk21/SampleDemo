public with sharing class PriceRightController {
	public transient Account accountData{get;set;}
	public transient Lead leadData{get;set;}
	public transient  List<sku> skuList{get;set;}
	public transient String comments {get;set;}
	public PriceRightController() {
		
	}

	public void parsePriceData(){
		String tData = ApexPages.currentPage().getParameters().get('pd');
		tData = EncodingUtil.urlDecode(tData, 'UTF-8');
		pricingData pDAta = (pricingData) JSON.deserialize(tData, PriceRightController.pricingData.class);
		accountData = new Account();
		accountData = pData.accountData;
		leadData = new Lead();
		leadData = pData.leadData;
		skuList = new List<sku>();
		skuList = pData.skuList;
		comments = '';
		comments = pData.comments;
	}


	@AuraEnabled 
	public static String postData(String leadId, String accountId, String tData, Boolean createSR){
		returnMessage ret = new returnMessage();
		String pData = EncodingUtil.urlDecode(tData, 'UTF-8');
		pricingData pd = (pricingData) JSON.deserialize(pData, PriceRightController.pricingData.class);

		Id accId;
		Id oppId;
		Id contId;

		if(accountId==null || accountId==''){
			//Convert Lead
			System.debug('Account Id is null' + accountId);
			Database.LeadConvert lc = new Database.LeadConvert();
			lc.setLeadId(leadId);
			LeadStatus convertStatus = [SELECT Id, MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1];
			lc.setConvertedStatus(convertStatus.MasterLabel);
			lc.setOpportunityName(pd.oppName);
			Database.LeadConvertResult lcr = Database.convertLead(lc);

			if(lcr.isSuccess()){
				accId = lcr.getAccountId();
				oppId = lcr.getOpportunityId();
				contId = lcr.getContactId();	
				System.debug('Lead converted successfully, Opp id is ' + oppId);
			}else{
				System.debug('Error converting lead');
			}

			
		}else{
			accId = (Id) accountId;
		}

		if(oppId==null){
			Opportunity opp = new Opportunity();
			opp.name = 'Demo Opportunity' + Datetime.now().format('yyyy-MM-dd HH:mm');
			opp.accountId = accId;
			opp.recordTypeId = '012B0000000IAKy';	
			opp.CloseDate = Date.today().addDays(30);
			opp.StageName = 'Negotiation';
			insert Opp;
			oppId = opp.Id;
			System.debug('Opp created successfully' + oppId);
		}

		Case cs = new Case();
		//Create a Case
		if(createSR){
			cs.recordTypeId = '012B0000000IALD';
			cs.accountId = accId;
			cs.subject = 'Support request for pricing';
			cs.Status = 'New';
			cs.Priority = 'Medium';
			cs.Opportunity__c = oppId;
			insert cs;
		}

		//Insert Pricing
		List<Pricing__c> prList = new List<Pricing__c>();

		for(sku s:pd.skuList){
			Pricing__c pr = new Pricing__c();
			pr.SKU_ID__c = s.skuId;
			pr.Opportunity__c = oppId;
			pr.Support_Case__c = cs.id;
			pr.Description__c = s.description;
			pr.Cieling__c = s.cieling;
			pr.Current_Price__c = s.currPrice;
			pr.Ext_Price__c = s.extPrice;
			pr.Floor__c	 = s.floor;
			pr.Impact__c = s.impact;
			pr.New_Price__c = s.newPrice;
			pr.Quantity__c = s.qty;
			pr.Target__c = s.target;
			pr.UOM__c = s.uom;
			prList.add(pr);
		}
		
		if(prList.size()>0) insert prList;
		

		//Attach pricing PDF to opp
		Attachment att = new Attachment();
		returnMessage retPdf = (returnMessage) JSON.deserialize(getPdfData(tData),PriceRightController.returnMessage.class);
		att.body = EncodingUtil.base64Decode((String) JSON.deserializeUntyped(retPdf.message));
		att.name = 'Pricing PDF dtd. ' + Datetime.now().format('yyyy-MM-dd HH:mm') + '.pdf';
		att.parentid = oppId;
		att.ContentType = 'application/pdf';
		insert att;

		System.debug('PDF attached successfully');

		ret.success = true;
		ret.message = JSON.serialize(oppId);
		return JSON.serialize(ret);
	}


	@AuraEnabled
	public static String getInitData(String leadId, String accountId){
		returnMessage ret = new returnMessage();

		initData inData = new initData();
		inData.mmOptions = new List<mmOption>();
		inData.pricingLead = new Lead();
		List<Lead> tmpLead = new List<Lead>();

		mmOption option = new mmOption();
		option.label = '--None--';
		option.value = '--None--';
		inData.mmOptions.add(option);

		option = new mmOption();
		option.label = 'Plus';
		option.value = 'Plus';
		inData.mmOptions.add(option);

		option = new mmOption();
		option.label = 'Premium';
		option.value = 'Premium';
		inData.mmOptions.add(option);

		option = new mmOption();
		option.label = 'Regular';
		option.value = 'Regular';
		inData.mmOptions.add(option);

		tmpLead = [Select Id, Name, email from Lead where Id=:leadId];
		if(tmpLead.size()>0){
			inData.pricingLead = tmpLead[0];
		}

		ret.success = true;
		ret.message = JSON.serialize(inData);
		return JSON.serialize(ret);
	}

	@AuraEnabled 
	public static String getAccounts(String accName){
		accName = EncodingUtil.urlDecode(accName, 'UTF-8');
		accName = accName + '%';
		//Hardcoded here but in Staple org, this will be SOQL
		returnMessage ret = new returnMessage();
		
		List<Account> accs = [Select Id, Name, AccountNumber, Bill_To_Number__c, Master_Account_Division__c, Target_Price_Realization_TPR__c FROM Account WHERE Name like :accName];
		ret.success = true;
		ret.message = JSON.serialize(accs);
		return JSON.serialize(ret);

	}

	//This is used by both account lookup and lead lookup although in Staples org this will be a SOQL or integration
	@AuraEnabled 
	public static String getSelectAccountInfo(String accId){

		if(accId=='Premium' || accId=='Plus' || accId=='Regular'){
			accId = '001B000000EPKVM';
		}
		returnMessage ret = new returnMessage();
		List<Account> accs = [Select Id, Name, AccountNumber, Bill_To_Number__c, Master_Account_Division__c, Target_Price_Realization_TPR__c FROM Account WHERE Id = :accId];	

		ret.success = true;
		if(accs.size()>0){
			ret.message = JSON.serialize(accs[0]);
		}else
		{
			ret.message = '{}';
		}
		return JSON.serialize(ret);
	}

	@AuraEnabled
	public static String getLeadData(String leadId){
		returnMessage ret = new returnMessage();
		Lead l = [Select Id, Name, email from Lead where Id=:leadId];
		ret.success = true;
		ret.message = JSON.serialize(l);
		return JSON.serialize(ret);
	}

	
	@AuraEnabled
	public static String getSku(String skuId){
		//Hard Code for now, but this will be SOQL/Integration in Staples Org
		returnMessage ret = new returnMessage();
		sku s = new sku();
		s = getSkuInfo(skuId);
		ret.success = true;
		ret.message = JSON.serialize(s);
		return JSON.serialize(ret);
	}

	private static sku getSkuInfo(String skuId){
		sku s = new sku();
		s.skuId = skuId;
		if(skuId=='12345' || skuId=='324791' ){
			s.rplAvl = true;
			s.rplSku = getSkuInfo('84567');
		}
		s.description = 'Staples SKU with Id: ' + skuId;
		s.uom = 'CT';
		s.onCont = 'Y';
		s.floor = (Math.random() * 100);
		s.floor = s.floor.setScale(2);
		s.target = s.floor + 10;
		s.cieling = s.floor + 10;
		s.currPrice = s.target;
		s.newPrice = s.target;
		s.qty = 1;
		s.extPrice = s.newPrice * s.qty;
		s.impact = 0;
		s.showPrice = 'slds-hide'; // Bad practice to tie CSS class in data; but this is a demo, so no issues
		return s;
	}
	
	@RemoteAction
	public static String getPdfData(String inData){
		returnMessage ret = new returnMessage();
		//String pricingData = EncodingUtil.urlEncode(inData, 'UTF-8');
		//Hardcoded here for demo, in Staples org, this will be dynamically generated using the PriceRightPDF VF page and PriceRightController
		//String vfURL = URL.getSalesforceBaseURL().getHost().replace('salesforce','visual.force')
		PageReference pdf = new PageReference('/apex/StaplesDemoPricingPDF?pd='+inData);
		String b64 = EncodingUtil.base64Encode(pdf.getContent());
		ret.success = true;
		ret.message = JSON.serialize(b64);
		return JSON.serialize(ret);

	}

	

	public class sku{
		public String skuId {get;set;}
		public String description {get;set;}
		public String uom  {get;set;}
		public String onCont  {get;set;}
		public Decimal floor  {get;set;}
		public Decimal target  {get;set;}
		public Decimal cieling  {get;set;}
		public Decimal currPrice  {get;set;}
		public Decimal newPrice  {get;set;}
		public Decimal qty  {get;set;}
		public Decimal extPrice  {get;set;}
		public Decimal impact  {get;set;}
		public String showPrice {get;set;}
		public Boolean rplAvl {get;set;}
		public sku rplSku {get;set;}
	}

	private class mmOption{
		String label {get;set;}
		String value {get;set;}
	}

	private class accInfo{
		String accName {get;set;}
		String accNo {get;set;}
		String div {get;set;}
		String billTo {get;set;}
		String tpr {get;set;}
		String accLoc {get;set;}
	}


	private class initData{
		Lead pricingLead {get;set;}
		List<mmOption> mmOptions {get;set;}
	}

	private class returnMessage{
    	public Boolean success{get;set;}
    	public String message{get;set;}
    }

    public class pricingData{
    	Account accountData {get;set;}
    	Lead leadData {get;set;}
    	List<sku> skuList {get;set;}
    	String comments {get;set;}
    	String oppName {get;set;}
    }
}