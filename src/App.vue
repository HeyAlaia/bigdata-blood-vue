<template>
  <LineageGraph :lineage-data="bloodMap" highlight-color="#063970" textWaterMarker="数据血缘" />
</template>

<script>
import LineageGraph from './components/LineageGraph/index.vue'
import data from './data.json'

export default {
  name: 'DataBlood',
  components: {
    LineageGraph
  },
  data: function () {
    return {
      bloodMap: data
    }
  },
  created() { },
  mounted() {
  },
  methods: {
  }
}
</script>
