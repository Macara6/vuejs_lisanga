

<script setup>
import { cancelCreditTransaction, fetchAllTransactionCredit } from '@/service/Api';
import {  onMounted, ref, computed, h } from 'vue';
import { useToast } from "primevue/usetoast";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

const transactions = ref([]);
const filterType = ref("");
const filterDate = ref("");
const filterReference = ref("");
const toast = useToast();

const cancelDialogVisible = ref(false);
const selectedTransaction = ref(null);
 const isSuperUser = localStorage.getItem('is_superuser') === 'true';

onMounted(async() => {
    await fechedAllTransaction();
})

const filterTransactions = computed(() => {
    return transactions.value.filter(tx => {
        let matchType = !filterType.value || tx.transaction_type === filterType.value;
        let matchDate = !filterDate.value  ||
         new Date(tx.created_at).toISOString().slice(0,10) === filterDate.value;
         let matchReferece = !filterReference.value ||
         tx.reference?.toLowerCase().includes(filterReference.value.toLowerCase());
         return matchType && matchDate && matchReferece;
    })
}) 

async function fechedAllTransaction(){
    const userId = localStorage.getItem('id');
    
    try{
        if(isSuperUser){
        const response = await fetchAllTransactionCredit();
        transactions.value = response;
        console.log('transactions credits', transactions.value)
        }else{
          transactions.value = (await fetchAllTransactionCredit()).filter(us => us.user == userId);
        }
    }catch(error){
        console.error('erreur lors de la récuperation des transaction', error);
    }
}


function confirmCancelTransaction(transaction){
  selectedTransaction.value = transaction;
  cancelDialogVisible.value = true;
}

async function proceedCancelTransaction(){
  try{
    const result = await cancelCreditTransaction(selectedTransaction.value.id);
    toast.add({severity: "success",summary: "Transaction annulée",detail: result.message,life: 3000});
    cancelDialogVisible.value =false;
   await fechedAllTransaction();
  }catch(error){
      toast.add({severity: "error",summary: "Erreur",detail: "Impossible d'annuler la transaction",life: 3000
    });
  }
}
function resetFilters(){
    filterType.value = "";
    filterDate.value = "";
    filterReference ="";
}
function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function downloadPDF(){
  const doc = new jsPDF({unit: 'pt', format:'a4'});
  doc.setFontSize(14);
  doc.text('Historique des crédits et remboursements', 40,40);
  
  const columns = [
    {header:'ID', dataKey:'id'},
    {header:'Type', dataKey:'transaction_type'},
    {header:'Montant', dataKey:'amount'},
    {header:'Référence',dataKey:'reference'},
    {header:'Reste', dataKey:'balance_due'},
    {header:'Compte', dataKey:'compte_name'},
    {header:'Dete', dataKey:'created_at'},
  ];
  const rows = filterTransactions.value.map(tx =>({
    id:tx.id,
    transaction_type:tx.transaction_type,
    amount:formatCurrency(tx.amount),
    reference:tx.reference,
    balance_due:formatCurrency(tx.balance_due),
    compte_name:tx.compte_name,
    created_at:tx.created_at ? new Date(tx.created_at).toLocaleString() :'',
  }));
  autoTable(doc, {
    head :[columns.map(c => c.header)],
    body:rows.map(r => columns.map(c => r[c.dataKey])),
    startY:70,
    theme:"grid",
    headStyles: {fillColor: [41, 128, 185], textColor:255},
    styles:{fontSize:10, cellPadding:4},
  });
  doc.save('Historique_crédit_remboursement.pdf');
}

</script>
<template>
 <div>
      <div class="p-6 space-y-6">
  <!-- Cartes et informations utilisateur ici -->

  <!-- Historique des transactions -->
  <Card class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
    <template #title>
      <h2 class="text-xl font-bold text-gray-700 dark:text-gray-100">
        📜 Historique des  Crédits et Remboursements 
      </h2>
    </template>

    <template #content>
      <div v-if="transactions.length === 0" class="text-gray-500 text-center py-6">
        <i class="pi pi-inbox text-2xl"></i>
        <p>Aucune transaction trouvée </p>
      </div>

      <div v-else class="flex flex-col">
        <!-- Filtres -->
        <div class="flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label class="block text-sm text-gray-500 mb-1">Type</label>
            <Dropdown 
              v-model="filterType"
              :options="[
                { label: 'Tous', value: '' },
                { label: 'CRÉDIT', value: 'CREDIT' },
                { label: 'REMBOURSEMENT', value: 'REMBOURSEMENT' },
                { label:'ANNULER', value:'ANNULATION'},
                
              ]" 
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrer par type"
              class="w-40"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-500 mb-1">Date</label>
            <input type="date" v-model="filterDate" class="border rounded px-2 py-1"/>
          </div>

            <div>
              <label class="block text-sm text-gray-500 mb-1">Référence</label>
              <input 
                type="text" 
               v-model="filterReference"
                placeholder="Ex: REF12345" 
                class="border rounded px-2 py-1"
              />
            </div>
            <div>
              <Button 
                label="Réinitialiser" 
                icon="pi pi-refresh" 
                severity="secondary" 
                @click="resetFilters" 
              />
            </div>
             <Button label="Télécharger PDF" v-if="isSuperUser" icon="pi pi-file-pdf" class="p-button-danger" @click="downloadPDF" />
        </div>

        <!-- Table scrollable -->
        <div class="overflow-y-auto" style="max-height: 500px;">
          <DataTable 
            :value="filterTransactions"
            scrollable
            scrollHeight="400px"
            class="min-w-full"
          >
            <Column field="id" header="ID" style="min-width: 80px"></Column>
            <Column field="type" header="Type" style="min-width: 120px">
              <template #body="{ data }">
                <span :class="data.type === 'deposit' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                  {{ data.transaction_type }}
                </span>
              </template>
            </Column>
            <Column field="amount" header="Montant" style="min-width: 150px">
              <template #body="{ data }">
                {{ formatCurrency( data.amount) }}
              </template>
            </Column>
            <Column field="reference" header="Référence" style="min-width: 180px"></Column>
            <Column field="balance_due" header="Reste" style="min-width: 150px">
              <template #body="{ data }">
                {{ formatCurrency(data.balance_due) }}
              </template>
            </Column>
             <Column field="compte_name" header="Compte" style="min-width: 180px"></Column>
            <Column field="created_at" header="Date" style="min-width: 200px">
              <template #body="{ data }">
                {{ new Date(data.created_at).toLocaleString() }}
              </template>
            </Column>
            <Column v-if="isSuperUser" header="Actions" style="min-width: 150px">
                  <template #body="{ data }">
                    <Button 
                    v-if="data.transaction_type !=='ANNULATION'"
                      label="Annuler" 
                      icon="pi pi-times" 
                      severity="danger" 
                      size="small"
                      @click="confirmCancelTransaction(data)" 
                    />
                  </template>
                </Column>
          </DataTable>
        </div>
      </div>
    </template>
  </Card>
    </div>
    </div>


  <Dialog v-model:visible="cancelDialogVisible" :style="{ width: '450px' }" header="Confirmation" :modal="true">
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl" />
      <span>
        Êtes-vous sûr de vouloir annuler la transaction N° <b>{{ selectedTransaction?.id }}</b> ?
      </span>
    </div>
    <template #footer>
      <Button label="Non" icon="pi pi-times" text @click="cancelDialogVisible = false" />
      <Button label="Oui, annuler" icon="pi pi-check" severity="danger" text @click="proceedCancelTransaction" />
    </template>
  </Dialog>



</template>