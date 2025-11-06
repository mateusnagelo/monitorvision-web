import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Grid,
  Link,
  Fade,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useState } from "react";

interface ProductDetailModalProps {
  product: any;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailModal({
  product,
  onOpenChange,
}: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState("1");

  if (!product) return null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={!!product}
      onClose={() => onOpenChange(false)}
      maxWidth="lg"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={500}
    >
      <DialogTitle>TRIBUTAÇÃO DO PRODUTO</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          {product.description}
        </Typography>
        <TabContext value={activeTab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleTabChange} aria-label="Detalhes do produto">
              <Tab label="Tributação" value="1" />
              <Tab label="Classificação" value="2" />
              <Tab label="Casos Especiais" value="3" />
              <Tab label="Calculadora" value="4" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <Grid container spacing={2}>
              {/* ICMS */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>ICMS</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography fontWeight="bold">Tributação</Typography>
                      <Typography>{product.icms?.origin?.description || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography fontWeight="bold">CST</Typography>
                      <Typography>{`${product.icms?.cst} - ${product.icms?.cst_description}`}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography fontWeight="bold">Alíquota</Typography>
                      <Typography>{`${product.icms?.aliquota || 0}%`}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography fontWeight="bold">Base Legal</Typography>
                      <Link href={product.icms?.legal_base_url} target="_blank" rel="noopener noreferrer">
                        {product.icms?.legal_base}
                      </Link>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* PIS/COFINS */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>PIS / COFINS</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography fontWeight="bold">Tributação</Typography>
                      <Typography>{product.pis_cofins?.description || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography fontWeight="bold">Alíquota PIS</Typography>
                      <Typography>{`${product.pis_cofins?.pis_aliquota || 0}%`}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography fontWeight="bold">Alíquota COFINS</Typography>
                      <Typography>{`${product.pis_cofins?.cofins_aliquota || 0}%`}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">CST Entrada</Typography>
                      <Typography>{`${product.pis_cofins?.cst_input} - ${product.pis_cofins?.cst_input_description}`}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">CST Saída</Typography>
                      <Typography>{`${product.pis_cofins?.cst_output} - ${product.pis_cofins?.cst_output_description}`}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography fontWeight="bold">Natureza da Receita</Typography>
                      <Typography>{product.pis_cofins?.revenue_nature_code ? `${product.pis_cofins.revenue_nature_code} - ${product.pis_cofins.revenue_nature_description}` : "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography fontWeight="bold">Base Legal</Typography>
                      <Link href={product.pis_cofins?.legal_base_url} target="_blank" rel="noopener noreferrer">
                        {product.pis_cofins?.legal_base}
                      </Link>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* CFOP */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>CFOP</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">Compra No Estado</Typography>
                      <Typography>{product.cfop?.in_state || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">Compra Fora do Estado</Typography>
                      <Typography>{product.cfop?.out_of_state || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">Venda No Estado</Typography>
                      <Typography>{product.cfop?.in_state_sale || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">Venda Fora do Estado</Typography>
                      <Typography>{product.cfop?.out_of_state_sale || "N/A"}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value="2">
            <Paper elevation={3} sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography fontWeight="bold">NCM</Typography>
                  <Typography>{`${product.ncm?.code} - ${product.ncm?.description}`}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold">CEST</Typography>
                  <Typography>
                    {product.cest?.code ? `${product.cest.code} - ${product.cest.description}` : "Não se aplica"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>
          <TabPanel value="3">Casos Especiais</TabPanel>
          <TabPanel value="4">Calculadora</TabPanel>
        </TabContext>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onOpenChange(false)}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}