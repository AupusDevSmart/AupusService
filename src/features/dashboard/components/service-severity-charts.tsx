// src/features/dashboard/components/service-severity-charts.tsx
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ServiceSeverityData, RiskLevelsData, ChartEntry } from '../types';

interface ServiceSeverityChartsProps {
  serviceSeverity: ServiceSeverityData;
  riskLevels: RiskLevelsData;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  value: number;
}

interface LegendProps {
  data: ChartEntry[];
}

function Legend({ data }: LegendProps) {
  return (
    <div className="flex flex-col space-y-2 mt-4">
      {data.map((entry, index) => (
        <div key={index} className="flex items-center text-sm">
          <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-foreground">{entry.name}</span>
          <span className="ml-auto text-muted-foreground">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

function renderCustomizedLabel(props: CustomLabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
      fill="currentColor"
    >
      {`${value}%`}
    </text>
  );
}

interface PieChartSectionProps {
  title: string;
  data: ChartEntry[];
}

function PieChartSection({ title, data }: PieChartSectionProps) {
  return (
    <div className="flex flex-col">
      <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">
        {title}
      </h4>
      <div className="h-48 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={70}
              innerRadius={35}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <Legend data={data} />
    </div>
  );
}

export function ServiceSeverityCharts({ serviceSeverity, riskLevels }: ServiceSeverityChartsProps) {
  const severityData: ChartEntry[] = [
    { name: 'Baixa', value: serviceSeverity.baixa, color: '#10B981' },
    { name: 'Média', value: serviceSeverity.media, color: '#F59E0B' },
    { name: 'Alta', value: serviceSeverity.alta, color: '#F97316' },
    { name: 'Crítica', value: serviceSeverity.critica, color: '#EF4444' }
  ];

  const riskData: ChartEntry[] = [
    { name: 'Baixo', value: riskLevels.low, color: '#3B82F6' },
    { name: 'Médio', value: riskLevels.medium, color: '#F59E0B' },
    { name: 'Alto', value: riskLevels.high, color: '#EF4444' }
  ];

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-6 text-foreground">
        Severidade dos Serviços
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
        <PieChartSection 
          title="Severidade" 
          data={severityData} 
        />
        <PieChartSection 
          title="Níveis de Risco" 
          data={riskData} 
        />
      </div>
    </Card>
  );
}