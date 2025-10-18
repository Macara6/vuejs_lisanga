
<script setup>
import { fetchTransactionOrUser } from '@/service/Api';
import { ref, onMounted, computed } from 'vue';

const filterType = ref("");
const filterDate = ref("");
const transactions = ref([])

onMounted(async() =>{
    await fetchedTransaction();
})

async function fetchedTransaction(){
    const userId = localStorage.getItem('id');

    try{
    const response = await fetchTransactionOrUser(userId);
    transactions.value = response
    console.log('transaction pour cette utilisateur', transactions.value);

  } catch(error){
    console.error('error to fetching transaction');
    throw error;
  }
}

const filterTransactions = computed(() => {
  return transactions.value.filter(tx => {
    let matchType = !filterType.value || tx.transaction_type === filterType.value;
    let matchDate = !filterDate.value || 
      new Date(tx.created_at).toISOString().slice(0,10) === filterDate.value;
      return matchType && matchDate;
  });
});

function formatLabel(key) {
  return key.replace(/_/g, ' ');
}

function formatValue(key, value) {
  if (key === 'date_joined') return new Date(value).toLocaleDateString();
  return value ?? '-';
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
        📜 Historique des transactions
      </h2>
    </template>

    <template #content>
      <div v-if="transactions.length === 0" class="text-gray-500 text-center py-6">
        <i class="pi pi-inbox text-2xl"></i>
        <p>Aucune transaction trouvée pour cet utilisateur.</p>
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
                { label: 'Dépôt', value: 'DEPOT' },
                { label: 'Retrait', value: 'RETRAIT' },
                { label:  'Sociale', value :'SOCIALE'},
                { label: 'Envoie', value :'ENVOIE'}
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
        </div>

        <!-- Table scrollable -->
        <div class="overflow-y-auto" style="max-height: 500px;">
          <DataTable 
            :value="filterTransactions"
            scrollable
            scrollHeight="300px"
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
                ${{ data.amount }}
              </template>
            </Column>
            <Column field="reference" header="Référence" style="min-width: 180px"></Column>
            <Column field="balance_after" header="Solde après" style="min-width: 150px">
              <template #body="{ data }">
                ${{ data.balance_after }}
              </template>
            </Column>
            <Column field="created_at" header="Date" style="min-width: 200px">
              <template #body="{ data }">
                {{ new Date(data.created_at).toLocaleString() }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </template>
  </Card>
</div>
    </div>
</template>