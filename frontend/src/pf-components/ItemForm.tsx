import React, { useState } from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  TextArea,
  ActionGroup,
  Button,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Alert,
  PageSection,
  Title,
  Card,
  CardBody
} from '@patternfly/react-core';

export const ItemForm: React.FC = () => {
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState('dev');
  const [description, setDescription] = useState('');
  const [isValidName, setIsValidName] = useState<boolean | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const environments = [
    { value: 'dev', label: 'Development' },
    { value: 'qa', label: 'QA' },
    { value: 'prod', label: 'Production' }
  ];

  const handleNameChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setName(value);
    if (value.length > 3) {
      setIsValidName(true);
    } else {
        setIsValidName(false);
    }
  };

  const validate = () => {
      let valid = true;
      if (name.length <= 3) {
          setIsValidName(false);
          valid = false;
      }
      return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Randomly succeed or fail
      if (Math.random() > 0.3) {
        setSubmitStatus('success');
        setName('');
        setDescription('');
      } else {
        setSubmitStatus('error');
      }
    }, 1500);
  };

  const onCancel = () => {
      setName('');
      setDescription('');
      setIsValidName(null);
      setSubmitStatus(null);
  };

  return (
    <PageSection>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Title headingLevel="h1" size="2xl" style={{ marginBottom: '1rem' }}>Create New Resource</Title>
            
            {submitStatus === 'success' && (
                <Alert variant="success" title="Resource created successfully" isInline style={{ marginBottom: '1rem' }} actionClose={<div onClick={() => setSubmitStatus(null)}></div>} />
            )}
            {submitStatus === 'error' && (
                 <Alert variant="danger" title="Failed to create resource" isInline style={{ marginBottom: '1rem' }} actionClose={<div onClick={() => setSubmitStatus(null)}></div>}>
                    Please try again later.
                 </Alert>
            )}

            <Card>
                <CardBody>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup
                            label="Resource Name"
                            isRequired
                            fieldId="resource-name"
                        >
                            <TextInput
                                isRequired
                                type="text"
                                id="resource-name"
                                name="resource-name"
                                value={name}
                                onChange={handleNameChange}
                                validated={isValidName === false ? 'error' : 'default'}
                            />
                            {isValidName === false && (
                                <FormHelperText>
                                    <HelperText>
                                        <HelperTextItem variant="error">Name must be at least 4 characters</HelperTextItem>
                                    </HelperText>
                                </FormHelperText>
                            )}
                             <FormHelperText>
                                <HelperText>
                                    <HelperTextItem>Unique identifier for the resource.</HelperTextItem>
                                </HelperText>
                            </FormHelperText>
                        </FormGroup>

                        <FormGroup label="Environment" fieldId="environment">
                            <FormSelect
                                value={environment}
                                onChange={(_event, value) => setEnvironment(value)}
                                id="environment"
                                name="environment"
                                aria-label="Environment"
                            >
                            {environments.map((option, index) => (
                                <FormSelectOption key={index} value={option.value} label={option.label} />
                            ))}
                            </FormSelect>
                        </FormGroup>

                        <FormGroup label="Description" fieldId="description">
                            <TextArea
                                value={description}
                                onChange={(_event, value) => setDescription(value)}
                                id="description"
                                name="description"
                                aria-label="Description"
                            />
                        </FormGroup>

                        <ActionGroup>
                            <Button variant="primary" type="submit" isLoading={isSubmitting} isDisabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Resource'}
                            </Button>
                            <Button variant="link" onClick={onCancel}>Cancel</Button>
                        </ActionGroup>
                    </Form>
                </CardBody>
            </Card>
        </div>
    </PageSection>
  );
};
