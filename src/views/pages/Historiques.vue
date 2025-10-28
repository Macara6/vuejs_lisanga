
<script setup>
import { fetchHistoriqueTransaction, cancelTransaction, cancelCreditTransaction } from '@/service/Api';
import { computed, onMounted, ref } from 'vue';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "primevue/usetoast";

const transactions = ref([]);
const filterType = ref('');
const filterDate = ref('');
const filterReference = ref('');
const toast = useToast();
const cancelDialogVisible = ref(false);
const selectedTransaction = ref(null);
const loading = ref(false);


const filterTransactions = computed(() => {
  return transactions.value.filter(tx => {
    const matchType = !filterType.value || tx.transaction_type === filterType.value;
    const matchDate = !filterDate.value ||
      new Date(tx.created_at).toISOString().slice(0, 10) === filterDate.value;
    const matchReference = !filterReference.value ||
      (tx.reference && tx.reference.toLowerCase().includes(filterReference.value.toLowerCase()));
    return matchType && matchDate && matchReference;
  });
});

onMounted(async () => {
  await fetchingTransactionHisto();
});

async function fetchingTransactionHisto(forceReload = false) {
  const CACHE_KEY_TRANS ="cached_transactions";
  const CACHE_KEY_TRANS_TIME="cached_transactions_time";
  const CACHE_DURATION_CREDIT = 4*60*1000;
  const now = Date.now();

  const CacheTransactions = localStorage.getItem(CACHE_KEY_TRANS);
  const cacheTime = localStorage.getItem(CACHE_KEY_TRANS_TIME);

  if(CacheTransactions && cacheTime && !forceReload && now - Number(cacheTime) < CACHE_DURATION_CREDIT){
    transactions.value = JSON.parse(CacheTransactions);
    return;
  }

  loading.value = true;
  try {
    const response = await fetchHistoriqueTransaction();
    transactions.value = response || [];

    localStorage.setItem(CACHE_KEY_TRANS, JSON.stringify(response));
    localStorage.setItem(CACHE_KEY_TRANS_TIME, now.toString());

  } catch (error) {
    console.error('Erreur lors du fetch', error);
  }finally{
    loading.value = false;
  }
}


async function resetFilters() {
  filterType.value = '';
  filterDate.value = '';
  filterReference.value = '';
  console.log('salut');
  await fetchingTransactionHisto(true);
  
}

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function downloadPDF() {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(' Historique des transactions depôt, retrait, envoie', 40, 40);

  const columns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Type', dataKey: 'transaction_type' },
    { header: 'Montant', dataKey: 'amount' },
    { header: 'Référence', dataKey: 'reference' },
    { header: 'Compte', dataKey: 'compte_name' },
    { header: 'Solde après', dataKey: 'balance_after' },
    { header: 'Date', dataKey: 'created_at' },
  ];

 
  const rows = filterTransactions.value.map(tx => ({
    id: tx.id,
    transaction_type: tx.transaction_type,
    amount: formatCurrency(tx.amount),
    reference: tx.reference,
    compte_name: tx.compte_name,
    balance_after: formatCurrency(tx.balance_after),
    created_at: tx.created_at ? new Date(tx.created_at).toLocaleString() : '',
  }));

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: rows.map(r => columns.map(c => r[c.dataKey])),
    startY: 70,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  doc.save('Historique_transactions.pdf');
}



function confirmCancelTransaction(transaction){
  selectedTransaction.value = transaction;
  cancelDialogVisible.value = true;
}

async function proceedCancelTransaction(){
  try{
    const result = await cancelTransaction(selectedTransaction.value.id);
    toast.add({severity: "success",summary: "Transaction annulée",detail: result.message,life: 3000
    });
    cancelDialogVisible.value = false;
    await fetchingTransactionHisto(true);
  }catch(error){
      toast.add({severity: "error",summary: "Erreur",detail: "Impossible d'annuler la transaction",life: 3000
    });
  }
}

</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <Card class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 lg:p-8 mt-6">
      <template #title>
        <h2 class="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-100">
          📜 Historique des transactions dépôt, retrait, envoi
        </h2>
      </template>

      <template #content>
        <div v-if="transactions.length === 0" class="text-gray-500 text-center py-6">
          <i class="pi pi-inbox text-2xl sm:text-3xl"></i>
          <p>Pas des données trouvée..</p>

          <div v-if="loading" class="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
            <p class="text-gray-500 text-lg">Chargement des données...</p>
          </div>
        </div>

        <div v-else class="flex flex-col">
          <!-- Filtres -->
          <div class="flex flex-col sm:flex-row flex-wrap gap-4 items-end mb-4">
            <div class="flex flex-col">
              <label class="block text-sm text-gray-500 mb-1">Type</label>
              <Dropdown 
                v-model="filterType" 
                :options="[
                  { label: 'Tous', value: '' },
                  { label: 'Dépôt', value: 'DEPOT' },
                  { label: 'Retrait', value: 'RETRAIT' },
                  { label: 'Sociale', value: 'SOCIALE' },
                  { label: 'Envoie',  value:'ENVOIE'},
                  { label: 'Annuler', value:'ANNULATION'}
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="Filtrer par type"
                class="w-full sm:w-40"
              />
            </div>

            <div class="flex flex-col">
              <label class="block text-sm text-gray-500 mb-1">Date</label>
              <input type="date" v-model="filterDate" class="border rounded px-2 py-1 w-full sm:w-auto"/>
            </div>

            <div class="flex flex-col">
              <label class="block text-sm text-gray-500 mb-1">Référence</label>
              <input type="text" v-model="filterReference" placeholder="Ex: REF12345" class="border rounded px-2 py-1 w-full sm:w-auto"/>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button label="Actualiser" icon="pi pi-refresh" severity="secondary" class="w-full sm:w-auto" @click="resetFilters" :loading="loading" />
              <Button label="Télécharger PDF" icon="pi pi-file-pdf" class="p-button-danger w-full sm:w-auto" @click="downloadPDF" />
            </div>
          </div>

          <!-- Table scrollable -->
          <div class="overflow-x-auto">
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
                    <span :class="data.transaction_type === 'DEPOT' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                      {{ data.transaction_type }}
                    </span>
                  </template>
                </Column>
                <Column field="amount" header="Montant" style="min-width: 150px">
                  <template #body="{ data }">
                    {{ (Number(data.amount) || 0).toLocaleString('en-US', {style:'currency', currency:'USD'}) }}
                  </template>
                </Column>
                <Column field="reference" header="Référence" style="min-width: 180px"></Column>
                <Column field="compte_name" header="Compte" style="min-width: 180px"></Column>
                <Column field="balance_after" header="Solde après" style="min-width: 150px">
                  <template #body="{ data }">
                    {{ (Number(data.balance_after) || 0).toLocaleString('en-US', {style:'currency', currency:'USD'}) }}
                  </template>
                </Column>
                <Column field="created_at" header="Date" style="min-width: 200px">
                  <template #body="{ data }">
                    {{ data.created_at ? new Date(data.created_at).toLocaleString() : '' }}
                  </template>
                </Column>
                <Column header="Actions" style="min-width: 150px">
                  <template #body="{ data }">
                    <Button 
                      v-if="data.transaction_type !=='ANNULATION'"
                      label="Annuler" 
                      icon="pi pi-times" 
                      severity="danger" 
                      size="small"
                      class="w-full sm:w-auto"
                      @click="confirmCancelTransaction(data)" 
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Dialog Annulation -->
    <Dialog v-model:visible="cancelDialogVisible" :style="{ width: '90%', maxWidth: '450px' }" header="Confirmation" :modal="true">
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>
          Êtes-vous sûr de vouloir annuler la transaction N° <b>{{ selectedTransaction?.id }}</b> ?
        </span>
      </div>
      <template #footer>
        <div class="flex flex-col sm:flex-row gap-3 justify-end w-full">
          <Button label="Non" icon="pi pi-times" text class="w-full sm:w-auto" @click="cancelDialogVisible = false" />
          <Button label="Oui, annuler" icon="pi pi-check" severity="danger" text class="w-full sm:w-auto" @click="proceedCancelTransaction" />
        </div>
      </template>
    </Dialog>

  </div>
</template>
