import React, { useState, useContext, useEffect } from 'react';
import { ButtonGroup, Button } from 'reactstrap';
import StatsContext from './StatsContext';

enum TimePeriod {
  All = 0,
  Last12Months = 1,
  LastMonth = 2,
  Custom = 3
}

const TimePeriodSelector: React.FC = () => {
  const context = useContext(StatsContext);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(TimePeriod.All);
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Initialize custom dates to last 12 months when component mounts
  useEffect(() => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    setCustomFrom(formatDateForInput(twelveMonthsAgo));
    setCustomTo(formatDateForInput(now));
  }, []);

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    const now = context.dataTo;
    let since: Date;
    let to: Date;

    switch (period) {
      case TimePeriod.All:
        since = context.dataSince;
        to = context.dataTo;
        break;
      case TimePeriod.Last12Months:
        to = now;
        since = new Date(now);
        since.setMonth(now.getMonth() - 12);
        break;
      case TimePeriod.LastMonth:
        to = now;
        since = new Date(now);
        since.setMonth(now.getMonth() - 1);
        break;
      case TimePeriod.Custom:
        since = new Date(customFrom);
        to = new Date(customTo);
        break;
      default:
        since = context.dataSince;
        to = context.dataTo;
    }

    context.setTimePeriod(since, to);
  };

  const handleCustomDateChange = () => {
    if (customFrom && customTo) {
      const since = new Date(customFrom);
      const to = new Date(customTo);
      context.setTimePeriod(since, to);
    }
  };

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center mb-3">
        <span className="mr-3" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Time Period:</span>
        <ButtonGroup size="md">
          <Button
            active={selectedPeriod === TimePeriod.All}
            color="primary"
            onClick={() => handlePeriodChange(TimePeriod.All)}
          >
            All
          </Button>
          <Button
            active={selectedPeriod === TimePeriod.Last12Months}
            color="primary"
            onClick={() => handlePeriodChange(TimePeriod.Last12Months)}
          >
            Last 12 Months
          </Button>
          <Button
            active={selectedPeriod === TimePeriod.LastMonth}
            color="primary"
            onClick={() => handlePeriodChange(TimePeriod.LastMonth)}
          >
            Last Month
          </Button>
          <Button
            active={selectedPeriod === TimePeriod.Custom}
            color="primary"
            onClick={() => handlePeriodChange(TimePeriod.Custom)}
          >
            Custom
          </Button>
        </ButtonGroup>
      </div>

      {selectedPeriod === TimePeriod.Custom && (
        <div className="d-flex align-items-center ml-3">
          <label className="mr-2 mb-0">From:</label>
          <input
            type="date"
            className="form-control mr-3"
            style={{ width: 'auto' }}
            value={customFrom}
            min={formatDateForInput(context.dataSince)}
            max={formatDateForInput(context.dataTo)}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
          <label className="mr-2 mb-0">To:</label>
          <input
            type="date"
            className="form-control mr-3"
            style={{ width: 'auto' }}
            value={customTo}
            min={formatDateForInput(context.dataSince)}
            max={formatDateForInput(context.dataTo)}
            onChange={(e) => setCustomTo(e.target.value)}
          />
          <Button
            color="success"
            onClick={handleCustomDateChange}
            disabled={!customFrom || !customTo}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export default TimePeriodSelector;
