<script setup>
import { fetchAllCredit, fetchUserCredit } from '@/service/Api';
import { computed, h, onMounted, ref } from 'vue';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';




const credits = ref([]);
const filterStatus = ref("");
const startDate = ref(""); 
const endDate = ref(""); 
const isSuperUser = localStorage.getItem('is_superuser') === 'true';

const loading = ref(false)
onMounted(async () => {
    await fechingCredits();
})

async function fechingCredits(forceReload = false){
  const CACHE_KEY_CREDIT = "cached_credits";
  const CACHE_KEY_CREDIT_TIME ="cached_credits_time";
  const CACHE_DURATION =10*60*1000;
  const now = Date.now();

  const cacheCredits = localStorage.getItem(CACHE_KEY_CREDIT);
  const cacheTime = localStorage.getItem(CACHE_KEY_CREDIT_TIME);
 

  if(cacheCredits && cacheTime && !forceReload && now - Number(cacheTime) < CACHE_DURATION){
    credits.value = JSON.parse(cacheCredits);
    return;
  }
  const userId = localStorage.getItem('id');
   loading.value = true;
    try{
      if(isSuperUser){
        const response = await fetchAllCredit();
         credits.value = response;

         localStorage.setItem(CACHE_KEY_CREDIT, JSON.stringify(response));
         localStorage.setItem(CACHE_KEY_CREDIT_TIME, now.toString());
      }else{
        credits.value = await fetchUserCredit(userId)
       
      }
    }catch(error){
        console.log('error to  feching crédit')
        throw error;
    }finally{
      loading.value=false;
    }
}

const filteredCredits = computed(() => {
    return credits.value.filter(c => {
        const statusMatch =
        filterStatus.value ===""||
        (filterStatus.value ==="PAYER" && c.is_paid) ||
        (filterStatus.value ==="ENCOURS" && !c.is_paid);

        let dateMatch = true;
        const createdDate = new Date(c.created_at);
        if (startDate.value){
            dateMatch = dateMatch && createdDate >= new Date(startDate.value);
        }
        if (endDate.value){
            dateMatch = dateMatch && createdDate <= new Date(endDate.value);
        }
        return statusMatch && dateMatch;
    });
});

function resetFilters(){
    filterStatus.value = "";
    startDate.value = "";
    endDate.value = "";
}




function getSeverity(isPaid) {
    return isPaid ? 'success' : 'warning'
}

function getLabel(isPaid) {
    return isPaid ? 'Payer' : 'En cours'
}
function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
function downloadPDF() {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Liste de credits', 40, 40);

  const columns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Montant', dataKey: 'princilal' },
    { header: 'Remboursable', dataKey: 'total_due' },
    {header:  'Intérêt',dataKey:'interset_rate'},
    {header:  'Reste', dataKey:'balance_due'},
    {header:  'Date début',dataKey:'created_at'},
    {header:  'Date de fin', dataKey:'due_date'},
    { header: 'Compte', dataKey: 'compte_name'},
    {header:'Status',dataKey:'is_paid'}
  ];

 
  const rows = filteredCredits.value.map(cr => ({
    id: cr.id,
    princilal: formatCurrency(cr.princilal),
    total_due: formatCurrency(cr.total_due),
    interset_rate: cr.interset_rate * 100,
    balance_due: formatCurrency(cr.balance_due),
    created_at: cr.created_at ? new Date(cr.created_at).toLocaleString() : '',
    due_date: cr.due_date ? new Date(cr.due_date).toLocaleString(): '',
    compte_name:cr.compte_name,
    is_paid:cr.is_paid ? 'Payer' :'En cours'
  }));

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: rows.map(r => columns.map(c => r[c.dataKey])),
    startY: 70,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  doc.save('liste_des_credits.pdf');
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
        📜 Liste de crédits
      </h2>
    </template>

    <template #content>
      <div v-if="credits.length ===0" class="text-gray-500 text-center py-6">
         <i class="pi pi-inbox text-2xl sm:text-3xl"></i>
         <p>Pas des données trouvée..</p>

        <div v-if="loading" class="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
            <p class="text-gray-500 text-lg">Chargement des données...</p>
        </div>

      </div>

      <div  v-else class="flex flex-col">
        <!-- Filtres -->
        <div class="flex flex-wrap gap-4 items-center mb-4">
           <div>
            <label class="block text-sm text-gray-500 mb-1">Statut</label>
            <Dropdown
              v-model="filterStatus"
              :options="[
                { label: 'Tous', value: '' },
                { label: 'Payer', value: 'PAYER' },
                { label: 'En cours', value: 'ENCOURS' }
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrer par statut"
              class="w-40"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-500 mb-1">Date début</label>
            <input
              type="date"
              v-model="startDate"
              class="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">Date fin</label>
            <input
              type="date"
              v-model="endDate"
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
            :value="filteredCredits"
            scrollable
            scrollHeight="400px"
            class="min-w-full"
          >
            <Column field="id" header="ID" style="min-width: 80px"></Column>
            <Column field="princilal" header="Montant" style="min-width: 120px">
              <template #body="{data}">
                  {{ formatCurrency(data.princilal) }}
              </template>
            </Column>
            <Column field="total_due" header="Remboursable" style="min-width: 150px">
                <template #body="{data}">
                  {{ formatCurrency(data.total_due) }}
                </template>
            </Column>
            <Column field="interset_rate" header="Intérêts" style="min-width: 180px">
              <template #body="{data}">
                 {{ data.interset_rate * 100}} %
              </template>
            </Column>
            <Column field="balance_due" header="Reste" style="min-width: 180px">
              <template #body="{data}">
                  {{ formatCurrency(data.balance_due) }}
              </template>
            </Column>
             <Column field="created_at" header="date début" style="min-width: 180px">
                <template #body="{data}">
                    {{ new Date(data.created_at).toLocaleString() }}
                </template>
             </Column>
            <Column field="due_date" header="date fin" style="min-width: 180px">
                <template #body="{data}">
                    {{ new Date(data.due_date).toLocaleString() }}
                </template>
             </Column>

            <Column field="is_paid" header="Status" style="min-width: 180px">
            <template #body="{ data }">
                <Tag 
                :value="data.is_paid ? 'Payer' : 'En cours'" 
                :severity="data.is_paid ? 'success' : 'warn'" 
                rounded 
                />
            </template>
            </Column>
            
            <Column field="compte_name" header="Compte" style="min-width: 180px"></Column>
          </DataTable>
        </div>
      </div>
    </template>
  </Card>
    </div>
    </div>
</template>